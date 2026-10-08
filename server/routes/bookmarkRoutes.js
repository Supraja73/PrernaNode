const express = require('express');
const { listBookmarks, addBookmark, removeBookmark } = require('../controllers/bookmarkController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // every bookmark route requires a logged-in user

router.get('/', listBookmarks);
router.post('/', addBookmark);
router.delete('/:id', removeBookmark);

module.exports = router;
