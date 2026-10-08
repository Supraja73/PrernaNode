const express = require('express');
const {
  listReplies,
  editComment,
  deleteComment,
  likeComment,
  unlikeComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const { commentRules } = require('../validators/commentValidators');

const router = express.Router();

router.get('/:id/replies', listReplies);
router.patch('/:id', protect, commentRules, editComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, likeComment);
router.delete('/:id/like', protect, unlikeComment);

module.exports = router;
