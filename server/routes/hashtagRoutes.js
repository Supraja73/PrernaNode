const express = require('express');
const { trendingHashtags, getHashtagPage } = require('../controllers/hashtagController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/trending', trendingHashtags);
router.get('/:tag', optionalAuth, getHashtagPage);

module.exports = router;
