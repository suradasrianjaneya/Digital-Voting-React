import prisma from '../config/db.js';
import { sendMail } from '../config/mail.js';

export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOtpEmail = async (email, otp, type) => {
  const expiryMinutes = 10;
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  // Store token in database
  await prisma.otpToken.create({
    data: {
      email,
      otp,
      type,
      expiresAt,
    },
  });

  const subject = type === 'VERIFY_ACCOUNT' ? 'Verify Your Account - Digital Voting' : 'Reset Your Password - Digital Voting';
  const actionText = type === 'VERIFY_ACCOUNT' ? 'verify your registration' : 'reset your account password';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #334155;">
      <h2 style="color: #8b5cf6; text-align: center; margin-bottom: 24px; font-weight: 700; font-size: 28px;">Digital Voting Platform</h2>
      <div style="background: #1e293b; padding: 24px; border-radius: 8px; border: 1px solid #475569; text-align: center;">
        <p style="font-size: 16px; margin-top: 0;">To ${actionText}, use the following 6-digit security code:</p>
        <h1 style="background: #0f172a; color: #38bdf8; display: inline-block; padding: 12px 28px; letter-spacing: 8px; font-size: 36px; border-radius: 6px; margin: 16px 0; border: 1px solid #0284c7; font-family: monospace;">${otp}</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 0;">This code is valid for <strong>${expiryMinutes} minutes</strong> and is strictly confidential.</p>
      </div>
      <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 24px;">If you did not request this OTP, you can safely ignore this email.</p>
    </div>
  `;

  await sendMail({ to: email, subject, html });
};

export const verifyOtp = async (email, otp, type) => {
  const token = await prisma.otpToken.findFirst({
    where: {
      email,
      otp,
      type,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!token) {
    return false;
  }

  // Delete matching OTPs to prevent single-use token replay attacks
  await prisma.otpToken.deleteMany({
    where: {
      email,
      type,
    },
  });

  return true;
};
