const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  createCommunity, updateCommunity, deleteCommunity, getCommunity, listCommunities, listCategories,
  joinCommunity, leaveCommunity, respondToJoinRequest, listJoinRequests, listMembers, setModerator,
  reportCommunity, communityAnalytics, getCommunityChat,
} = require('../controllers/communityController');
const { protect, optionalAuth } = require('../middleware/auth');
const { communityUpload } = require('../middleware/communityUpload');

const router = express.Router();

const createLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { success: false, message: 'Too many communities created recently.' } });

router.get('/categories', listCategories);
router.get('/', optionalAuth, listCommunities);
router.post('/', protect, createLimiter, communityUpload, createCommunity);
router.get('/:id', optionalAuth, getCommunity);
router.patch('/:id', protect, communityUpload, updateCommunity);
router.delete('/:id', protect, deleteCommunity);

router.post('/:id/join', protect, joinCommunity);
router.delete('/:id/join', protect, leaveCommunity);
router.get('/:id/requests', protect, listJoinRequests);
router.patch('/:id/requests/:userId', protect, respondToJoinRequest);

router.get('/:id/members', listMembers);
router.patch('/:id/members/:userId/role', protect, setModerator);

router.post('/:id/report', protect, reportCommunity);
router.get('/:id/analytics', protect, communityAnalytics);
router.get('/:id/chat', protect, getCommunityChat);

module.exports = router;
