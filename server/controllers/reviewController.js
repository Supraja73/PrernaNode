const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Skill = require('../models/Skill');
const Business = require('../models/Business');
const Product = require('../models/Product');
const { recalculateRating } = require('../services/ratingService');
const { notify } = require('../services/notificationService');

const paginate = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 30);
  return { page, limit, skip: (page - 1) * limit };
};

const ownerOf = async (targetType, targetId) => {
  const Model = { skill: Skill, business: Business, product: Product }[targetType];
  const doc = await Model.findById(targetId).select('mentor owner seller');
  if (!doc) return null;
  return doc.mentor || doc.owner || doc.seller;
};

const filesFromReq = (req) => (req.files?.images || []).map((f) => ({ url: f.path, publicId: f.filename }));

// @desc    Leave a review for a mentor (skill), business, or product
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { targetType, targetId, rating, title, description, anonymous } = req.body;

  const ownerId = await ownerOf(targetType, targetId);
  if (!ownerId) {
    res.status(404);
    throw new Error('The thing you are reviewing was not found');
  }
  if (String(ownerId) === String(req.user._id)) {
    res.status(400);
    throw new Error('You cannot review your own listing');
  }

  const pros = typeof req.body.pros === 'string' ? req.body.pros.split(',').map((p) => p.trim()).filter(Boolean) : req.body.pros || [];
  const cons = typeof req.body.cons === 'string' ? req.body.cons.split(',').map((c) => c.trim()).filter(Boolean) : req.body.cons || [];

  let review;
  try {
    review = await Review.create({
      author: req.user._id,
      targetType,
      targetId,
      rating,
      title,
      description,
      pros,
      cons,
      images: filesFromReq(req),
      anonymous: anonymous === 'true' || anonymous === true,
    });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409);
      throw new Error('You have already reviewed this');
    }
    throw err;
  }

  await recalculateRating(targetType, targetId);
  await notify({ recipient: ownerId, actor: req.user._id, type: 'new_review', message: `${req.user.name} left you a ${rating}-star review`, refModel: 'Review', refId: review._id });

  res.status(201).json({ success: true, data: review.toPublicObject(req.user._id) });
});

// @desc    List reviews for a target, paginated
// @route   GET /api/reviews?targetType=&targetId=&page=&limit=
// @access  Public
const listReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const { targetType, targetId } = req.query;
  if (!targetType || !targetId) {
    res.status(400);
    throw new Error('targetType and targetId are required');
  }

  const filter = { targetType, targetId, hidden: false };
  const [reviews, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('author', 'name username avatar'),
    Review.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: reviews.map((r) => r.toPublicObject(req.user?._id)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Reviews the logged-in user has written
// @route   GET /api/reviews/mine
// @access  Private
const listMyReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = { author: req.user._id };
  const [reviews, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Review.countDocuments(filter),
  ]);
  res.json({ success: true, data: reviews, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// @desc    Edit your own review
// @route   PATCH /api/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  if (String(review.author) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only edit your own review');
  }

  ['rating', 'title', 'description'].forEach((f) => {
    if (req.body[f] !== undefined) review[f] = req.body[f];
  });
  if (req.body.pros !== undefined) review.pros = typeof req.body.pros === 'string' ? req.body.pros.split(',').map((p) => p.trim()).filter(Boolean) : req.body.pros;
  if (req.body.cons !== undefined) review.cons = typeof req.body.cons === 'string' ? req.body.cons.split(',').map((c) => c.trim()).filter(Boolean) : req.body.cons;

  await review.save();
  await recalculateRating(review.targetType, review.targetId);
  res.json({ success: true, data: review.toPublicObject(req.user._id) });
});

// @desc    Delete your own review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  if (String(review.author) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only delete your own review');
  }
  const { targetType, targetId } = review;
  await review.deleteOne();
  await recalculateRating(targetType, targetId);
  res.json({ success: true, message: 'Review deleted' });
});

// @desc    Mark a review helpful / un-helpful (toggle)
// @route   POST /api/reviews/:id/helpful
// @access  Private
const toggleHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  const already = review.helpfulVotes.some((v) => String(v) === String(req.user._id));
  if (already) {
    review.helpfulVotes = review.helpfulVotes.filter((v) => String(v) !== String(req.user._id));
  } else {
    review.helpfulVotes.push(req.user._id);
  }
  await review.save();
  res.json({ success: true, data: { helpfulCount: review.helpfulVotes.length, helpfulByViewer: !already } });
});

// @desc    Report a review
// @route   POST /api/reviews/:id/report
// @access  Private
const reportReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { $inc: { reportsCount: 1 } }, { new: true });
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  if (review.reportsCount >= 5) {
    review.hidden = true;
    await review.save();
    await recalculateRating(review.targetType, review.targetId);
  }
  res.json({ success: true, message: 'Review reported. Our team will take a look.' });
});

module.exports = {
  createReview,
  listReviews,
  listMyReviews,
  updateReview,
  deleteReview,
  toggleHelpful,
  reportReview,
};
