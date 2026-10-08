const express = require('express');
const {
  createOpportunity, updateOpportunity, deleteOpportunity, getOpportunity, listOpportunities,
  listTypes, shareOpportunity, bookmarkOpportunity, unbookmarkOpportunity,
} = require('../controllers/opportunityController');
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Opportunity = require('../models/Opportunity');

const router = express.Router();

const opportunityRules = [
  body('title').trim().isLength({ min: 5, max: 160 }).withMessage('Title must be 5-160 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description is required'),
  body('type').isIn(Opportunity.TYPES).withMessage('Invalid opportunity type'),
  body('organization').trim().notEmpty().withMessage('Organization is required'),
  body('applyLink').trim().isURL().withMessage('A valid apply link is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400);
      return res.json({ success: false, message: errors.array()[0].msg });
    }
    next();
  },
];

router.get('/types', listTypes);
router.get('/', listOpportunities);
router.post('/', protect, opportunityRules, createOpportunity);
router.get('/:id', getOpportunity);
router.patch('/:id', protect, updateOpportunity);
router.delete('/:id', protect, deleteOpportunity);
router.post('/:id/share', protect, shareOpportunity);
router.post('/:id/bookmark', protect, bookmarkOpportunity);
router.delete('/:id/bookmark', protect, unbookmarkOpportunity);

module.exports = router;
