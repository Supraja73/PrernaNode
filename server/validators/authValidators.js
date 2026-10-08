const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return res.json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

const registerRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('username')
    .trim()
    .toLowerCase()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-z0-9_]+$/)
    .withMessage('Username can only contain lowercase letters, numbers, and underscores'),
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain a number'),
  handleValidation,
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

const forgotPasswordRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  handleValidation,
];

const resetPasswordRules = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain a number'),
  handleValidation,
];

const resendVerificationRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  handleValidation,
];

module.exports = {
  registerRules,
  loginRules,
  resendVerificationRules,
  forgotPasswordRules,
  resetPasswordRules,
};
