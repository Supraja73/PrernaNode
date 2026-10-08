const express = require('express');
const {
  followUser,
  unfollowUser,
  listFollowers,
  listFollowing,
  listMutualFollowers,
  suggestUsers,
  listNewMembers,
} = require('../controllers/followController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/suggestions', protect, suggestUsers);
router.get('/new-members', listNewMembers);
router.get('/:userId/followers', listFollowers);
router.get('/:userId/following', listFollowing);
router.get('/:userId/mutual', protect, listMutualFollowers);
router.post('/:userId', protect, followUser);
router.delete('/:userId', protect, unfollowUser);

module.exports = router;
