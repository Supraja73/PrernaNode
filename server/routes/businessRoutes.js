const express = require('express');
const {
  createBusiness, updateBusiness, deleteBusiness, getBusiness, listBusinesses,
  followBusiness, unfollowBusiness, listCategories, listByOwner,
} = require('../controllers/businessController');
const { protect, optionalAuth } = require('../middleware/auth');
const { businessUpload } = require('../middleware/part3Upload');
const { businessRules } = require('../validators/part3Validators');

const router = express.Router();

router.get('/categories', listCategories);
router.get('/owner/:userId', optionalAuth, listByOwner);
router.get('/', optionalAuth, listBusinesses);
router.post('/', protect, businessUpload, businessRules, createBusiness);
router.get('/:id', optionalAuth, getBusiness);
router.patch('/:id', protect, businessUpload, updateBusiness);
router.delete('/:id', protect, deleteBusiness);
router.post('/:id/follow', protect, followBusiness);
router.delete('/:id/follow', protect, unfollowBusiness);

module.exports = router;
