import { Router } from 'express';
import {
  register,
  verifyAccount,
  resendOtp,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import {
  registerSchema,
  verifyOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/authValidator.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/verify-account', validate(verifyOtpSchema), verifyAccount);
router.post('/resend-otp', resendOtp);
router.post('/login', validate(loginSchema), login);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

export default router;
