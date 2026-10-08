const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  createPost, listPosts, getPost, updatePost, deletePost, togglePin, voteOnPoll,
  likePost, unlikePost, addComment, listComments, deleteComment, reportPost, shareCommunityPost,
} = require('../controllers/communityPostController');
const { protect, optionalAuth } = require('../middleware/auth');
const { communityPostUpload } = require('../middleware/communityUpload');

const router = express.Router();

const createLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { success: false, message: 'Too many posts created recently.' } });

router.get('/:communityId', optionalAuth, listPosts);
router.post('/:communityId', protect, createLimiter, communityPostUpload, createPost);
router.get('/post/:id', getPost);
router.patch('/post/:id', protect, updatePost);
router.delete('/post/:id', protect, deletePost);
router.patch('/post/:id/pin', protect, togglePin);
router.post('/post/:id/vote', protect, voteOnPoll);
router.post('/post/:id/like', protect, likePost);
router.delete('/post/:id/like', protect, unlikePost);
router.post('/post/:id/comments', protect, addComment);
router.get('/post/:id/comments', listComments);
router.delete('/post/:id/comments/:commentId', protect, deleteComment);
router.post('/post/:id/report', protect, reportPost);
router.post('/post/:id/share', protect, shareCommunityPost);

module.exports = router;
