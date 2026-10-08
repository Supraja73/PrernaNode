const express = require('express');
const { popularCreators, trendingMentors } = require('../controllers/discoveryController');

const router = express.Router();

router.get('/popular-creators', popularCreators);
router.get('/trending-mentors', trendingMentors);

module.exports = router;
