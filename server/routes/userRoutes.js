const express = require('express');
const {
  getUserById,
  getUserByUsername,
  updateMe,
  uploadAvatar,
  uploadCover,
  followUser,
  unfollowUser,
  listUsers,
} = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/auth');
const { avatarUpload, coverUpload } = require('../middleware/upload');

const router = express.Router();

router.get('/', listUsers);
router.patch('/me', protect, updateMe);
router.post('/me/avatar', protect, avatarUpload.single('avatar'), uploadAvatar);
router.post('/me/cover', protect, coverUpload.single('cover'), uploadCover);
router.get('/u/:username', optionalAuth, getUserByUsername);
router.post('/:id/follow', protect, followUser);
router.delete('/:id/follow', protect, unfollowUser);
router.get('/:id', getUserById);

module.exports = router;
