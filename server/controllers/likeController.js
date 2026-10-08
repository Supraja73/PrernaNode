const asyncHandler = require('express-async-handler');
const Like = require('../models/Like');
const Story = require('../models/Story');
const User = require('../models/User');
const { notify } = require('../services/notificationService');

// @desc    Like a story
// @route   POST /api/stories/:id/like
// @access  Private
const likeStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) {
    res.status(404);
    throw new Error('Story not found');
  }

  try {
    await Like.create({ user: req.user._id, targetType: 'story', targetId: story._id });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409);
      throw new Error('Already liked');
    }
    throw err;
  }

  story.likesCount += 1;
  await story.save();

  await notify({
    recipient: story.author,
    actor: req.user._id,
    type: 'like_story',
    message: `${req.user.name} liked your story "${story.title}"`,
    story: story._id,
  });

  res.json({ success: true, data: { likesCount: story.likesCount } });
});

// @desc    Unlike a story
// @route   DELETE /api/stories/:id/like
// @access  Private
const unlikeStory = asyncHandler(async (req, res) => {
  const result = await Like.findOneAndDelete({ user: req.user._id, targetType: 'story', targetId: req.params.id });
  if (!result) {
    res.status(404);
    throw new Error('You have not liked this story');
  }
  const story = await Story.findByIdAndUpdate(req.params.id, { $inc: { likesCount: -1 } }, { new: true });
  res.json({ success: true, data: { likesCount: story?.likesCount ?? 0 } });
});

// @desc    List users who liked a story (paginated)
// @route   GET /api/stories/:id/likes
// @access  Public
const listStoryLikers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  const [likes, total] = await Promise.all([
    Like.find({ targetType: 'story', targetId: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'user', select: 'name username avatar headline', model: User }),
    Like.countDocuments({ targetType: 'story', targetId: req.params.id }),
  ]);

  res.json({
    success: true,
    data: likes.map((l) => l.user),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Save a story to the logged-in user's collection (thin wrapper over Bookmark)
// @route   POST /api/stories/:id/save
// @access  Private
const saveStory = asyncHandler(async (req, res) => {
  const Bookmark = require('../models/Bookmark');
  const story = await Story.findById(req.params.id);
  if (!story) {
    res.status(404);
    throw new Error('Story not found');
  }

  try {
    await Bookmark.create({ user: req.user._id, resourceType: 'story', resourceId: story._id });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409);
      throw new Error('Already saved');
    }
    throw err;
  }

  story.savesCount += 1;
  await story.save();

  await notify({
    recipient: story.author,
    actor: req.user._id,
    type: 'save',
    message: `${req.user.name} saved your story "${story.title}"`,
    story: story._id,
  });

  res.json({ success: true, data: { savesCount: story.savesCount } });
});

// @desc    Remove a saved story
// @route   DELETE /api/stories/:id/save
// @access  Private
const unsaveStory = asyncHandler(async (req, res) => {
  const Bookmark = require('../models/Bookmark');
  const result = await Bookmark.findOneAndDelete({
    user: req.user._id,
    resourceType: 'story',
    resourceId: req.params.id,
  });
  if (!result) {
    res.status(404);
    throw new Error('You have not saved this story');
  }
  const story = await Story.findByIdAndUpdate(req.params.id, { $inc: { savesCount: -1 } }, { new: true });
  res.json({ success: true, data: { savesCount: story?.savesCount ?? 0 } });
});

// @desc    List the logged-in user's saved stories
// @route   GET /api/stories/saved
// @access  Private
const listSavedStories = asyncHandler(async (req, res) => {
  const Bookmark = require('../models/Bookmark');
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 30);
  const skip = (page - 1) * limit;

  const [bookmarks, total] = await Promise.all([
    Bookmark.find({ user: req.user._id, resourceType: 'story' }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Bookmark.countDocuments({ user: req.user._id, resourceType: 'story' }),
  ]);

  const storyIds = bookmarks.map((b) => b.resourceId);
  const stories = await Story.find({ _id: { $in: storyIds } }).populate('author', 'name username avatar headline');
  const { attachViewerFlags } = require('./storyController');
  const ordered = storyIds
    .map((id) => stories.find((s) => String(s._id) === String(id)))
    .filter(Boolean);
  const withFlags = await attachViewerFlags(ordered, req.user._id);

  res.json({ success: true, data: withFlags, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// @desc    Record a share (increments count, returns a shareable link)
// @route   POST /api/stories/:id/share
// @access  Private
const shareStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) {
    res.status(404);
    throw new Error('Story not found');
  }

  story.sharesCount += 1;
  await story.save();

  await notify({
    recipient: story.author,
    actor: req.user._id,
    type: 'share',
    message: `${req.user.name} shared your story "${story.title}"`,
    story: story._id,
  });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  res.json({ success: true, data: { sharesCount: story.sharesCount, url: `${clientUrl}/stories/${story._id}` } });
});

module.exports = {
  likeStory,
  unlikeStory,
  listStoryLikers,
  saveStory,
  unsaveStory,
  listSavedStories,
  shareStory,
};
