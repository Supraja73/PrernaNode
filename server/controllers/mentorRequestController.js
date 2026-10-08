const asyncHandler = require('express-async-handler');
const MentorRequest = require('../models/MentorRequest');
const Skill = require('../models/Skill');
const { notify } = require('../services/notificationService');

const paginate = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 30);
  return { page, limit, skip: (page - 1) * limit };
};

const singleFileFromReq = (req, field) => {
  const f = req.files?.[field]?.[0] || req.file;
  return f ? { url: f.path, publicId: f.filename } : undefined;
};

// @desc    Send a mentorship request
// @route   POST /api/mentor-requests
// @access  Private
const createRequest = asyncHandler(async (req, res) => {
  const skill = await Skill.findById(req.body.skillId);
  if (!skill) {
    res.status(404);
    throw new Error('Skill listing not found');
  }
  if (String(skill.mentor) === String(req.user._id)) {
    res.status(400);
    throw new Error('You cannot request mentorship from yourself');
  }

  const request = await MentorRequest.create({
    skill: skill._id,
    mentor: skill.mentor,
    student: req.user._id,
    preferredDate: req.body.preferredDate,
    preferredTime: req.body.preferredTime,
    message: req.body.message,
    resume: singleFileFromReq(req, 'resume'),
  });

  await notify({
    recipient: skill.mentor,
    actor: req.user._id,
    type: 'mentor_request',
    message: `${req.user.name} requested mentorship for "${skill.skillName}"`,
  });

  res.status(201).json({ success: true, data: request });
});

// @desc    List requests (as student or mentor), filterable by status
// @route   GET /api/mentor-requests?role=student|mentor&status=
// @access  Private
const listRequests = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const role = req.query.role === 'mentor' ? 'mentor' : 'student';
  const filter = { [role]: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [requests, total] = await Promise.all([
    MentorRequest.find(filter)
      .sort({ preferredDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('skill', 'skillName category')
      .populate('mentor', 'name username avatar')
      .populate('student', 'name username avatar'),
    MentorRequest.countDocuments(filter),
  ]);

  res.json({ success: true, data: requests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const getRequest = asyncHandler(async (req, res) => {
  const request = await MentorRequest.findById(req.params.id)
    .populate('skill', 'skillName category')
    .populate('mentor', 'name username avatar')
    .populate('student', 'name username avatar');
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  const isParty = [String(request.mentor._id), String(request.student._id)].includes(String(req.user._id));
  if (!isParty) {
    res.status(403);
    throw new Error('You are not part of this request');
  }
  res.json({ success: true, data: request });
});

const assertMentor = (request, userId) => {
  if (String(request.mentor) !== String(userId)) {
    const err = new Error('Only the mentor can perform this action');
    err.statusCode = 403;
    throw err;
  }
};

// @desc    Mentor accepts a request
// @route   PATCH /api/mentor-requests/:id/accept
// @access  Private
const acceptRequest = asyncHandler(async (req, res) => {
  const request = await MentorRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  assertMentor(request, req.user._id);

  request.status = 'accepted';
  request.responseNote = req.body.responseNote || '';
  await request.save();

  await notify({ recipient: request.student, actor: req.user._id, type: 'mentor_request_accepted', message: `${req.user.name} accepted your mentorship request` });
  res.json({ success: true, data: request });
});

// @desc    Mentor rejects a request
// @route   PATCH /api/mentor-requests/:id/reject
// @access  Private
const rejectRequest = asyncHandler(async (req, res) => {
  const request = await MentorRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  assertMentor(request, req.user._id);

  request.status = 'rejected';
  request.responseNote = req.body.responseNote || '';
  await request.save();

  await notify({ recipient: request.student, actor: req.user._id, type: 'mentor_request_rejected', message: `${req.user.name} declined your mentorship request` });
  res.json({ success: true, data: request });
});

// @desc    Mentor suggests a new date/time
// @route   PATCH /api/mentor-requests/:id/suggest-time
// @access  Private
const suggestNewTime = asyncHandler(async (req, res) => {
  const request = await MentorRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  assertMentor(request, req.user._id);

  request.status = 'rescheduled';
  request.suggestedDate = req.body.suggestedDate;
  request.suggestedTime = req.body.suggestedTime;
  request.responseNote = req.body.responseNote || '';
  await request.save();

  await notify({ recipient: request.student, actor: req.user._id, type: 'mentor_request_rescheduled', message: `${req.user.name} suggested a new time for your session` });
  res.json({ success: true, data: request });
});

// @desc    Mark a session completed (mentor only)
// @route   PATCH /api/mentor-requests/:id/complete
// @access  Private
const completeRequest = asyncHandler(async (req, res) => {
  const request = await MentorRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  assertMentor(request, req.user._id);
  if (request.status !== 'accepted') {
    res.status(400);
    throw new Error('Only accepted sessions can be marked completed');
  }

  request.status = 'completed';
  await request.save();
  await Skill.findByIdAndUpdate(request.skill, { $inc: { totalStudents: 1 } });

  await notify({ recipient: request.student, actor: req.user._id, type: 'mentor_request_completed', message: `Your session with ${req.user.name} is marked completed` });
  res.json({ success: true, data: request });
});

// @desc    Cancel a session (either party)
// @route   PATCH /api/mentor-requests/:id/cancel
// @access  Private
const cancelRequest = asyncHandler(async (req, res) => {
  const request = await MentorRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  const isParty = [String(request.mentor), String(request.student)].includes(String(req.user._id));
  if (!isParty) {
    res.status(403);
    throw new Error('You are not part of this request');
  }

  request.status = 'cancelled';
  await request.save();

  const recipient = String(request.mentor) === String(req.user._id) ? request.student : request.mentor;
  await notify({ recipient, actor: req.user._id, type: 'mentor_request_cancelled', message: `${req.user.name} cancelled the mentorship session` });

  res.json({ success: true, data: request });
});

module.exports = {
  createRequest,
  listRequests,
  getRequest,
  acceptRequest,
  rejectRequest,
  suggestNewTime,
  completeRequest,
  cancelRequest,
};
