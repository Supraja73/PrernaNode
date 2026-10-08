const asyncHandler = require('express-async-handler');
const Collaboration = require('../models/Collaboration');
const Bookmark = require('../models/Bookmark');
const { notify } = require('../services/notificationService');

const paginate = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 12, 30);
  return { page, limit, skip: (page - 1) * limit };
};

const createCollaboration = asyncHandler(async (req, res) => {
  const body = req.body;
  const rolesNeeded = typeof body.rolesNeeded === 'string' ? body.rolesNeeded.split(',').map((r) => r.trim()).filter(Boolean) : body.rolesNeeded || [];
  const skillsNeeded = typeof body.skillsNeeded === 'string' ? body.skillsNeeded.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) : body.skillsNeeded || [];

  const collab = await Collaboration.create({
    postedBy: req.user._id,
    title: body.title,
    description: body.description,
    type: body.type,
    rolesNeeded,
    skillsNeeded,
  });
  res.status(201).json({ success: true, data: collab });
});

const listCollaborations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const q = req.query;
  const filter = { hidden: { $ne: true } };
  if (q.type) filter.type = q.type;
  if (q.status) filter.status = q.status;
  else filter.status = 'open';
  if (q.q) filter.$text = { $search: q.q };

  const [collabs, total] = await Promise.all([
    Collaboration.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('postedBy', 'name username avatar'),
    Collaboration.countDocuments(filter),
  ]);
  res.json({ success: true, data: collabs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const getCollaboration = asyncHandler(async (req, res) => {
  const collab = await Collaboration.findById(req.params.id)
    .populate('postedBy', 'name username avatar')
    .populate('applicants.user', 'name username avatar headline');
  if (!collab) {
    res.status(404);
    throw new Error('Collaboration not found');
  }
  res.json({ success: true, data: collab });
});

const closeCollaboration = asyncHandler(async (req, res) => {
  const collab = await Collaboration.findById(req.params.id);
  if (!collab) {
    res.status(404);
    throw new Error('Collaboration not found');
  }
  if (String(collab.postedBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only close your own posting');
  }
  collab.status = 'closed';
  await collab.save();
  res.json({ success: true, data: collab });
});

const deleteCollaboration = asyncHandler(async (req, res) => {
  const collab = await Collaboration.findById(req.params.id);
  if (!collab) {
    res.status(404);
    throw new Error('Collaboration not found');
  }
  if (String(collab.postedBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only delete your own posting');
  }
  await collab.deleteOne();
  res.json({ success: true, message: 'Collaboration deleted' });
});

// @desc    Apply to a collaboration
// @route   POST /api/collaborations/:id/apply
// @access  Private
const applyToCollaboration = asyncHandler(async (req, res) => {
  const collab = await Collaboration.findById(req.params.id);
  if (!collab) {
    res.status(404);
    throw new Error('Collaboration not found');
  }
  if (collab.status !== 'open') {
    res.status(400);
    throw new Error('This collaboration is closed');
  }
  if (String(collab.postedBy) === String(req.user._id)) {
    res.status(400);
    throw new Error('You cannot apply to your own posting');
  }
  const already = collab.applicants.some((a) => String(a.user) === String(req.user._id));
  if (already) {
    res.status(409);
    throw new Error('You already applied');
  }

  collab.applicants.push({ user: req.user._id, message: req.body.message || '' });
  await collab.save();

  await notify({ recipient: collab.postedBy, actor: req.user._id, type: 'collaboration_application', message: `${req.user.name} applied to "${collab.title}"`, refModel: 'Collaboration', refId: collab._id });

  res.json({ success: true, message: 'Applied successfully' });
});

// @desc    Accept/reject an applicant (poster only)
// @route   PATCH /api/collaborations/:id/applicants/:userId
// @access  Private
const respondToApplicant = asyncHandler(async (req, res) => {
  const collab = await Collaboration.findById(req.params.id);
  if (!collab) {
    res.status(404);
    throw new Error('Collaboration not found');
  }
  if (String(collab.postedBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Only the poster can manage applicants');
  }
  const applicant = collab.applicants.find((a) => String(a.user) === String(req.params.userId));
  if (!applicant) {
    res.status(404);
    throw new Error('Applicant not found');
  }
  const { action } = req.body; // 'accept' | 'reject'
  applicant.status = action === 'accept' ? 'accepted' : 'rejected';
  await collab.save();

  await notify({
    recipient: req.params.userId,
    actor: req.user._id,
    type: action === 'accept' ? 'collaboration_accepted' : 'collaboration_rejected',
    message: `Your application to "${collab.title}" was ${applicant.status}`,
    refModel: 'Collaboration',
    refId: collab._id,
  });

  res.json({ success: true, data: applicant });
});

const bookmarkCollaboration = asyncHandler(async (req, res) => {
  try {
    await Bookmark.create({ user: req.user._id, resourceType: 'collaboration', resourceId: req.params.id });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409);
      throw new Error('Already bookmarked');
    }
    throw err;
  }
  res.json({ success: true, message: 'Bookmarked' });
});

const unbookmarkCollaboration = asyncHandler(async (req, res) => {
  await Bookmark.findOneAndDelete({ user: req.user._id, resourceType: 'collaboration', resourceId: req.params.id });
  res.json({ success: true, message: 'Removed' });
});

const listTypes = asyncHandler(async (req, res) => {
  res.json({ success: true, data: Collaboration.TYPES });
});

module.exports = {
  createCollaboration, listCollaborations, getCollaboration, closeCollaboration, deleteCollaboration,
  applyToCollaboration, respondToApplicant, bookmarkCollaboration, unbookmarkCollaboration, listTypes,
};
