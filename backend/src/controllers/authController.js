import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { generateOtp, sendOtpEmail, verifyOtp } from '../services/otpService.js';
import { logEvent } from '../services/auditService.js';

const getIpAddress = (req) => {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
};

export const register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;
    const ipAddress = getIpAddress(req);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address already registered' });
    }

    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'USER';
    const isApproved = true;

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role,
        isVerified: false,
        isApproved,
      },
    });

    const otp = generateOtp();
    await sendOtpEmail(email, otp, 'VERIFY_ACCOUNT');

    await logEvent({
      userId: user.id,
      action: 'USER_REGISTER',
      details: `Registered account as ${role}. OTP verification email sent.`,
      ipAddress,
    });

    res.status(201).json({
      success: true,
      message: 'Registration initiated. Please verify your email with the 6-digit OTP code sent.',
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyAccount = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const ipAddress = getIpAddress(req);

    const isValid = await verifyOtp(email, otp, 'VERIFY_ACCOUNT');
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    const user = await prisma.user.update({
      where: { email },
      data: { isVerified: true },
    });

    await logEvent({
      userId: user.id,
      action: 'USER_VERIFIED',
      details: 'Email successfully verified. Account activated.',
      ipAddress,
    });

    res.status(200).json({
      success: true,
      message: 'Account successfully verified and activated. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

export const resendOtp = async (req, res, next) => {
  try {
    const { email, type } = req.body;
    const ipAddress = getIpAddress(req);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (type === 'VERIFY_ACCOUNT' && user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account is already verified' });
    }

    const otp = generateOtp();
    const otpType = type === 'RESET_PASSWORD' ? 'RESET_PASSWORD' : 'VERIFY_ACCOUNT';
    await sendOtpEmail(email, otp, otpType);

    await logEvent({
      userId: user.id,
      action: 'OTP_RESEND',
      details: `Resent OTP code of type: ${otpType}`,
      ipAddress,
    });

    res.status(200).json({
      success: true,
      message: 'New verification OTP sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = getIpAddress(req);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      const otp = generateOtp();
      await sendOtpEmail(email, otp, 'VERIFY_ACCOUNT');
      return res.status(403).json({
        success: false,
        code: 'UNVERIFIED',
        message: 'Account not verified. A new OTP has been sent to your email.',
      });
    }

    if (!user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending review or has been deactivated by an admin.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logEvent({
      userId: user.id,
      action: 'USER_LOGIN',
      details: 'Logged in successfully.',
      ipAddress,
    });

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    let token = null;

    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, val] = cookie.split('=').map((c) => c.trim());
        acc[key] = val;
        return acc;
      }, {});
      token = cookies.refreshToken;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.isVerified || !user.isApproved) {
      return res.status(401).json({ success: false, message: 'Invalid token state' });
    }

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Refresh token expired or invalid' });
  }
};

export const logout = async (req, res, next) => {
  try {
    const ipAddress = getIpAddress(req);
    if (req.user) {
      await logEvent({
        userId: req.user.id,
        action: 'USER_LOGOUT',
        details: 'Logged out successfully.',
        ipAddress,
      });
    }

    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0),
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const ipAddress = getIpAddress(req);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If the email matches an account, a password reset code was sent.',
      });
    }

    const otp = generateOtp();
    await sendOtpEmail(email, otp, 'RESET_PASSWORD');

    await logEvent({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      details: 'Password reset OTP email sent.',
      ipAddress,
    });

    res.status(200).json({
      success: true,
      message: 'If the email matches an account, a password reset code was sent.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;
    const ipAddress = getIpAddress(req);

    const isValid = await verifyOtp(email, otp, 'RESET_PASSWORD');
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    await logEvent({
      userId: user.id,
      action: 'PASSWORD_RESET_SUCCESS',
      details: 'Password updated via OTP reset process.',
      ipAddress,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};
