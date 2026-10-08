const asyncHandler = require('express-async-handler');
const Report = require('../models/Report');

// @desc    File a report against any supported content type or user profile
// @route   POST /api/reports
// @access  Private
const createReport = asyncHandler(async (req, res) => {
  const { targetType, targetId, reason, description } = req.body;

  if (!Report.TARGET_TYPES.includes(targetType)) {
    res.status(400);
    throw new Error(`Invalid targetType. Must be one of: ${Report.TARGET_TYPES.join(', ')}`);
  }

  const report = await Report.create({
    reporter: req.user._id,
    targetType,
    targetId,
    reason,
    description,
  });

  res.status(201).json({ success: true, message: 'Report submitted. Our moderation team will review it.', data: { id: report._id } });
});

// @desc    A user's own submitted reports (transparency — "did anything happen with my report")
// @route   GET /api/reports/mine
// @access  Private
const listMyReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ reporter: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, data: reports });
});

module.exports = { createReport, listMyReports };
