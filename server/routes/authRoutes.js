const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  register,
  verifyEmail,
  resendVerification,
  login,
  refresh,
  logout,
  getSessions,
  revokeSession,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { logLoginAttempt } = require('../middleware/activityLogger');
const {
  registerRules,
  loginRules,
  resendVerificationRules,
  forgotPasswordRules,
  resetPasswordRules,
} = require('../validators/authValidators');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Try again later.' },
});

router.post('/register', authLimiter, registerRules, register);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', authLimiter, resendVerificationRules, resendVerification);
router.post('/login', authLimiter, logLoginAttempt, loginRules, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/sessions', protect, getSessions);
router.delete('/sessions/:id', protect, revokeSession);
router.post('/forgot-password', authLimiter, forgotPasswordRules, forgotPassword);
router.post('/reset-password/:token', resetPasswordRules, resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
