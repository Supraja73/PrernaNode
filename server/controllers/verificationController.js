const asyncHandler = require('express-async-handler');
const VerificationRequest = require('../models/VerificationRequest');
const User = require('../models/User');

// @desc    Request a verification badge
// @route   POST /api/verification-requests
// @access  Private
const requestVerification = asyncHandler(async (req, res) => {
  const existing = await VerificationRequest.findOne({ user: req.user._id, status: 'pending' });
  if (existing) {
    res.status(409);
    throw new Error('You already have a pending verification request');
  }

  const request = await VerificationRequest.create({
    user: req.user._id,
    reason: req.body.reason,
    documentUrl: req.file?.path || '',
    documentPublicId: req.file?.filename || '',
  });

  await User.findByIdAndUpdate(req.user._id, { verificationBadgeStatus: 'pending' });

  res.status(201).json({ success: true, message: 'Verification request submitted', data: { id: request._id } });
});

const myVerificationStatus = asyncHandler(async (req, res) => {
  const request = await VerificationRequest.findOne({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: request });
});

module.exports = { requestVerification, myVerificationStatus };
