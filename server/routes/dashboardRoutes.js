const express = require('express');
const {
  mentorDashboard, mentorAnalytics, businessDashboard, marketplaceDashboard,
  businessAnalytics, dashboardSummary,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/summary', dashboardSummary);
router.get('/mentor', mentorDashboard);
router.get('/mentor/analytics', mentorAnalytics);
router.get('/business', businessDashboard);
router.get('/business/analytics', businessAnalytics);
router.get('/marketplace', marketplaceDashboard);

module.exports = router;
