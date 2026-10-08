const express = require('express');
const { createReport, listMyReports } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();
router.use(protect);

const reportLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, message: { success: false, message: 'Too many reports filed recently.' } });

router.post('/', reportLimiter, createReport);
router.get('/mine', listMyReports);

module.exports = router;
