const asyncHandler = require('express-async-handler');
const Report = require('../models/Report');
const { recordAudit } = require('../services/auditService');

const paginate = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  return { page, limit, skip: (page - 1) * limit };
};

// @desc    List reports, filterable by status/targetType
// @route   GET /api/admin/reports?status=&targetType=
// @access  Private (admin, moderator)
const listReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  else filter.status = 'pending';
  if (req.query.targetType) filter.targetType = req.query.targetType;

  const [reports, total] = await Promise.all([
    Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('reporter', 'name username avatar').populate('resolvedBy', 'name username'),
    Report.countDocuments(filter),
  ]);

  res.json({ success: true, data: reports, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const getReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id).populate('reporter', 'name username avatar').populate('resolvedBy', 'name username');
  if (!report) {
    res.status(404);
    throw new Error('Report not found');
  }
  res.json({ success: true, data: report });
});

// @desc    Mark a report reviewed/resolved/dismissed with an optional action taken
// @route   PATCH /api/admin/reports/:id
// @access  Private (admin, moderator)
const resolveReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) {
    res.status(404);
    throw new Error('Report not found');
  }
  const { status, actionTaken, adminNote } = req.body;
  report.status = status || 'resolved';
  if (actionTaken) report.actionTaken = actionTaken;
  if (adminNote !== undefined) report.adminNote = adminNote;
  report.resolvedBy = req.user._id;
  report.resolvedAt = new Date();
  await report.save();

  await recordAudit({ adminId: req.user._id, action: 'report.resolve', targetType: report.targetType, targetId: report.targetId, details: { status: report.status, actionTaken: report.actionTaken }, ip: req.ip });

  res.json({ success: true, data: report });
});

// @desc    Report history for a specific piece of content (all reports ever filed against it)
// @route   GET /api/admin/reports/history/:targetType/:targetId
// @access  Private (admin, moderator)
const reportHistory = asyncHandler(async (req, res) => {
  const reports = await Report.find({ targetType: req.params.targetType, targetId: req.params.targetId })
    .sort({ createdAt: -1 })
    .populate('reporter', 'name username')
    .populate('resolvedBy', 'name username');
  res.json({ success: true, data: reports });
});

module.exports = { listReports, getReport, resolveReport, reportHistory };
