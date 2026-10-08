const express = require('express');
const {
  createReview, listReviews, listMyReviews, updateReview, deleteReview, toggleHelpful, reportReview,
} = require('../controllers/reviewController');
const { protect, optionalAuth } = require('../middleware/auth');
const { reviewUpload } = require('../middleware/part3Upload');
const { reviewRules } = require('../validators/part3Validators');

const router = express.Router();

router.get('/', listReviews);
router.get('/mine', protect, listMyReviews);
router.post('/', protect, reviewUpload, reviewRules, createReview);
router.patch('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/helpful', protect, toggleHelpful);
router.post('/:id/report', protect, reportReview);

module.exports = router;
