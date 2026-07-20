import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export const protect = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. Access token is missing.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        return res.status(401).json({ success: false, message: 'User matching token no longer exists.' });
      }

      if (!user.isVerified) {
        return res.status(403).json({ success: false, message: 'Please verify your email address to continue.' });
      }

      if (!user.isApproved) {
        return res.status(403).json({ success: false, message: 'Your account is suspended or pending approval.' });
      }

      req.user = user;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          code: 'TOKEN_EXPIRED', 
          message: 'Access token expired. Please refresh your session.' 
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid token signature. Please log in again.' });
    }
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied. Administrator clearance required.' });
  }
};
