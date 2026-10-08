const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  runCareerFeature, runStoryFeature, mentorMatch, businessRecommendations, getHistory, status,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// AI calls cost real money against a real provider — rate-limited harder than typical routes.
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI request limit reached for this hour. Try again later.' },
});

router.get('/status', status);
router.get('/history', getHistory);
router.get('/mentor-match', mentorMatch);
router.get('/business-recommendations', businessRecommendations);
router.post('/career/:feature', aiLimiter, runCareerFeature);
router.post('/story/:feature', aiLimiter, runStoryFeature);

module.exports = router;
