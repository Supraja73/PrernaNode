const asyncHandler = require('express-async-handler');
const Settings = require('../models/Settings');
const { recordAudit } = require('../services/auditService');

const getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  res.json({ success: true, data: settings });
});

// @desc    Update platform settings (deep-merges nested objects so a partial update
//          doesn't wipe out sibling fields)
// @route   PATCH /api/admin/settings
// @access  Private (admin only — not moderators)
const updateSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  const body = req.body;

  const mergeableSections = ['features', 'registration', 'security', 'email'];
  mergeableSections.forEach((section) => {
    if (body[section]) settings[section] = { ...settings[section].toObject?.() ?? settings[section], ...body[section] };
  });
  ['platformName', 'maintenanceMode', 'maintenanceMessage'].forEach((field) => {
    if (body[field] !== undefined) settings[field] = body[field];
  });

  await settings.save();
  await recordAudit({ adminId: req.user._id, action: 'settings.update', details: body, ip: req.ip });

  res.json({ success: true, data: settings });
});

module.exports = { getSettings, updateSettings };
