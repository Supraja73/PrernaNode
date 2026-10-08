const asyncHandler = require('express-async-handler');
const Opportunity = require('../models/Opportunity');
const Bookmark = require('../models/Bookmark');

const paginate = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 15, 40);
  return { page, limit, skip: (page - 1) * limit };
};

const createOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.create({ ...req.body, postedBy: req.user._id });
  res.status(201).json({ success: true, data: opportunity });
});

const updateOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findById(req.params.id);
  if (!opportunity) {
    res.status(404);
    throw new Error('Opportunity not found');
  }
  if (String(opportunity.postedBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only edit your own postings');
  }
  Object.assign(opportunity, req.body);
  await opportunity.save();
  res.json({ success: true, data: opportunity });
});

const deleteOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findById(req.params.id);
  if (!opportunity) {
    res.status(404);
    throw new Error('Opportunity not found');
  }
  if (String(opportunity.postedBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only delete your own postings');
  }
  await opportunity.deleteOne();
  res.json({ success: true, message: 'Opportunity deleted' });
});

const getOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findById(req.params.id).populate('postedBy', 'name username avatar');
  if (!opportunity) {
    res.status(404);
    throw new Error('Opportunity not found');
  }
  opportunity.viewCount += 1;
  await opportunity.save();
  res.json({ success: true, data: opportunity });
});

// @desc    Browse opportunities — filter by type/mode/location, search, sort by deadline
// @route   GET /api/opportunities?type=&mode=&location=&q=&page=&limit=
// @access  Public
const listOpportunities = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const q = req.query;
  const filter = { isActive: true };
  if (q.type) filter.type = q.type;
  if (q.mode) filter.mode = q.mode;
  if (q.location) filter.location = { $regex: q.location, $options: 'i' };
  if (q.q) filter.$text = { $search: q.q };
  if (q.upcoming === 'true') filter.deadline = { $gte: new Date() };

  const [opportunities, total] = await Promise.all([
    Opportunity.find(filter).sort({ deadline: 1, createdAt: -1 }).skip(skip).limit(limit).populate('postedBy', 'name username avatar'),
    Opportunity.countDocuments(filter),
  ]);

  res.json({ success: true, data: opportunities, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const listTypes = asyncHandler(async (req, res) => {
  res.json({ success: true, data: Opportunity.TYPES });
});

const shareOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findByIdAndUpdate(req.params.id, { $inc: { sharesCount: 1 } }, { new: true });
  if (!opportunity) {
    res.status(404);
    throw new Error('Opportunity not found');
  }
  res.json({ success: true, data: { sharesCount: opportunity.sharesCount } });
});

// bookmarking reuses Part 1's generic Bookmark model (resourceType: 'opportunity')
const bookmarkOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findById(req.params.id);
  if (!opportunity) {
    res.status(404);
    throw new Error('Opportunity not found');
  }
  try {
    await Bookmark.create({ user: req.user._id, resourceType: 'opportunity', resourceId: opportunity._id });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409);
      throw new Error('Already bookmarked');
    }
    throw err;
  }
  opportunity.bookmarksCount += 1;
  await opportunity.save();
  res.json({ success: true, data: { bookmarksCount: opportunity.bookmarksCount } });
});

const unbookmarkOpportunity = asyncHandler(async (req, res) => {
  const result = await Bookmark.findOneAndDelete({ user: req.user._id, resourceType: 'opportunity', resourceId: req.params.id });
  if (!result) {
    res.status(404);
    throw new Error('Not bookmarked');
  }
  const opportunity = await Opportunity.findByIdAndUpdate(req.params.id, { $inc: { bookmarksCount: -1 } }, { new: true });
  res.json({ success: true, data: { bookmarksCount: opportunity?.bookmarksCount ?? 0 } });
});

module.exports = {
  createOpportunity, updateOpportunity, deleteOpportunity, getOpportunity, listOpportunities,
  listTypes, shareOpportunity, bookmarkOpportunity, unbookmarkOpportunity,
};
