const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return res.json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

const commentRules = [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment must be 1-2000 characters'),
  handleValidation,
];

module.exports = { commentRules, handleValidation };
