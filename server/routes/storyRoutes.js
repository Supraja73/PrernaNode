const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  createStory,
  updateStory,
  archiveStory,
  togglePin,
  deleteStory,
  getStory,
  getFeed,
  getUserStories,
  searchStories,
  listCategories,
} = require('../controllers/storyController');
const {
  likeStory,
  unlikeStory,
  listStoryLikers,
  saveStory,
  unsaveStory,
  listSavedStories,
  shareStory,
} = require('../controllers/likeController');
const {
  addComment,
  listComments,
} = require('../controllers/commentController');
const { protect, optionalAuth } = require('../middleware/auth');
const { storyFilesMiddleware } = require('../middleware/storyUpload');
const { storyRules } = require('../validators/storyValidators');
const { commentRules } = require('../validators/commentValidators');

const router = express.Router();

// Throttle story/comment creation to curb spam, per the Part 2 security requirements.
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many stories created recently. Try again later.' },
});

router.get('/categories', listCategories);
router.get('/feed', optionalAuth, getFeed);
router.get('/search', optionalAuth, searchStories);
router.get('/saved', protect, listSavedStories);
router.get('/user/:userId', optionalAuth, getUserStories);

router.post('/', protect, createLimiter, storyFilesMiddleware, storyRules, createStory);
router.get('/:id', optionalAuth, getStory);
router.patch('/:id', protect, storyFilesMiddleware, updateStory);
router.patch('/:id/archive', protect, archiveStory);
router.patch('/:id/pin', protect, togglePin);
router.delete('/:id', protect, deleteStory);

router.post('/:id/like', protect, likeStory);
router.delete('/:id/like', protect, unlikeStory);
router.get('/:id/likes', listStoryLikers);

router.post('/:id/save', protect, saveStory);
router.delete('/:id/save', protect, unsaveStory);

router.post('/:id/share', protect, shareStory);

router.post('/:storyId/comments', protect, createLimiter, commentRules, addComment);
router.get('/:storyId/comments', listComments);

module.exports = router;
