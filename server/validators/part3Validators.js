const { body, validationResult } = require('express-validator');
const Skill = require('../models/Skill');
const Business = require('../models/Business');
const Product = require('../models/Product');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return res.json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

const skillRules = [
  body('skillName').trim().isLength({ min: 2, max: 100 }).withMessage('Skill name must be 2-100 characters'),
  body('category').isIn(Skill.CATEGORIES).withMessage('Invalid category'),
  body('experienceLevel').isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert']).withMessage('Invalid experience level'),
  body('yearsOfExperience').isInt({ min: 0, max: 60 }).withMessage('Years of experience must be 0-60'),
  body('teachingMode').isIn(['Online', 'Offline', 'Hybrid']).withMessage('Invalid teaching mode'),
  handleValidation,
];

const mentorRequestRules = [
  body('preferredDate').isISO8601().withMessage('A valid preferred date is required'),
  body('preferredTime').trim().notEmpty().withMessage('Preferred time is required'),
  handleValidation,
];

const businessRules = [
  body('businessName').trim().isLength({ min: 2, max: 120 }).withMessage('Business name must be 2-120 characters'),
  body('category').isIn(Business.CATEGORIES).withMessage('Invalid category'),
  handleValidation,
];

const productRules = [
  body('name').trim().isLength({ min: 2, max: 140 }).withMessage('Product name must be 2-140 characters'),
  body('description').trim().isLength({ min: 10, max: 5000 }).withMessage('Description must be at least 10 characters'),
  body('category').isIn(Product.CATEGORIES).withMessage('Invalid category'),
  handleValidation,
];

const reviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('description').trim().isLength({ min: 5, max: 3000 }).withMessage('Review must be at least 5 characters'),
  body('targetType').isIn(['skill', 'business', 'product']).withMessage('Invalid review target'),
  handleValidation,
];

const inquiryRules = [
  body('initialMessage').trim().isLength({ min: 3, max: 2000 }).withMessage('Message must be at least 3 characters'),
  handleValidation,
];

module.exports = {
  skillRules,
  mentorRequestRules,
  businessRules,
  productRules,
  reviewRules,
  inquiryRules,
  handleValidation,
};
