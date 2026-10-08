const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const VerificationRequest = require('../models/VerificationRequest');
const { recordAudit } = require('../services/auditService');
const { notify } = require('../services/notificationService');

const paginate = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  return { page, limit, skip: (page - 1) * limit };
};

// @desc    Search/filter users
// @route   GET /api/admin/users?q=&role=&status=&page=&limit=
// @access  Private (admin)
const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const q = req.query;
  const filter = {};
  if (q.q) filter.$or = [{ name: { $regex: q.q, $options: 'i' } }, { email: { $regex: q.q, $options: 'i' } }, { username: { $regex: q.q, $options: 'i' } }];
  if (q.role) filter.role = q.role;
  if (q.status === 'banned') filter.isBanned = true;
  if (q.status === 'suspended') filter.isSuspended = true;
  if (q.status === 'active') { filter.isBanned = false; filter.isSuspended = false; }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-refreshTokens'),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data: users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const getUserDetail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, data: user.toSafeObject() });
});

const auditAndRespond = async (req, res, action, targetId, details, message) => {
  await recordAudit({ adminId: req.user._id, action, targetType: 'User', targetId, details, ip: req.ip });
  res.json({ success: true, message });
};

// @desc    Suspend a user temporarily
// @route   PATCH /api/admin/users/:id/suspend
// @access  Private (admin)
const suspendUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Cannot suspend another admin');
  }

  user.isSuspended = true;
  user.suspensionReason = req.body.reason || 'Policy violation';
  user.suspendedUntil = req.body.until ? new Date(req.body.until) : undefined;
  await user.save();

  await notify({ recipient: user._id, actor: req.user._id, type: 'system_announcement', message: `Your account has been suspended. Reason: ${user.suspensionReason}` });
  await auditAndRespond(req, res, 'user.suspend', user._id, { reason: user.suspensionReason, until: user.suspendedUntil }, 'User suspended');
});

const reactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.isSuspended = false;
  user.suspensionReason = '';
  user.suspendedUntil = undefined;
  await user.save();

  await notify({ recipient: user._id, actor: req.user._id, type: 'system_announcement', message: 'Your account has been reactivated.' });
  await auditAndRespond(req, res, 'user.reactivate', user._id, {}, 'User reactivated');
});

const banUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Cannot ban another admin');
  }
  user.isBanned = true;
  user.banReason = req.body.reason || 'Policy violation';
  await user.save();

  await auditAndRespond(req, res, 'user.ban', user._id, { reason: user.banReason }, 'User banned');
});

const unbanUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.isBanned = false;
  user.banReason = '';
  await user.save();

  await auditAndRespond(req, res, 'user.unban', user._id, {}, 'User unbanned');
});

// @desc    Permanently remove a user account (hard delete — irreversible)
// @route   DELETE /api/admin/users/:id
// @access  Private (admin)
const removeUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Cannot remove another admin');
  }
  await user.deleteOne();
  await auditAndRespond(req, res, 'user.remove', req.params.id, {}, 'User removed');
});

// @desc    Warn a user (recorded, does not block access)
// @route   POST /api/admin/users/:id/warn
// @access  Private (admin)
const warnUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { $inc: { warningsCount: 1 } }, { new: true });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  await notify({ recipient: user._id, actor: req.user._id, type: 'system_announcement', message: `Warning from PrernaNode moderation: ${req.body.reason || 'Please review our community guidelines.'}` });
  await auditAndRespond(req, res, 'user.warn', user._id, { reason: req.body.reason }, 'Warning issued');
});

const assignModerator = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { role: 'moderator' }, { new: true });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  await auditAndRespond(req, res, 'user.assign_moderator', user._id, {}, 'User is now a moderator');
});

const removeModerator = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'moderator') user.role = 'member';
  await user.save();
  await auditAndRespond(req, res, 'user.remove_moderator', user._id, {}, 'Moderator role removed');
});

// @desc    List pending verification badge requests
// @route   GET /api/admin/verification-requests
// @access  Private (admin)
const listVerificationRequests = asyncHandler(async (req, res) => {
  const requests = await VerificationRequest.find({ status: 'pending' }).sort({ createdAt: 1 }).populate('user', 'name username avatar email');
  res.json({ success: true, data: requests });
});

const reviewVerificationRequest = asyncHandler(async (req, res) => {
  const request = await VerificationRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Verification request not found');
  }
  const { action, note } = req.body; // 'approve' | 'reject'
  request.status = action === 'approve' ? 'approved' : 'rejected';
  request.reviewedBy = req.user._id;
  request.reviewNote = note || '';
  request.reviewedAt = new Date();
  await request.save();

  await User.findByIdAndUpdate(request.user, { verificationBadgeStatus: request.status });
  await notify({ recipient: request.user, actor: req.user._id, type: 'system_announcement', message: `Your verification request was ${request.status}.` });
  await auditAndRespond(req, res, 'user.verification_review', request.user, { status: request.status }, `Request ${request.status}`);
});

module.exports = {
  listUsers, getUserDetail, suspendUser, reactivateUser, banUser, unbanUser, removeUser, warnUser,
  assignModerator, removeModerator, listVerificationRequests, reviewVerificationRequest,
};
