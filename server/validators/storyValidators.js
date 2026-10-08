const { body, validationResult } = require('express-validator');
const Story = require('../models/Story');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return res.json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

const storyRules = [
  body('title').trim().isLength({ min: 4, max: 140 }).withMessage('Title must be 4-140 characters'),
  body('description').trim().isLength({ min: 10, max: 12000 }).withMessage('Description must be at least 10 characters'),
  body('category')
    .trim()
    .isIn(Story.CATEGORIES)
    .withMessage(`Category must be one of: ${Story.CATEGORIES.join(', ')}`),
  handleValidation,
];

module.exports = { storyRules, handleValidation };
