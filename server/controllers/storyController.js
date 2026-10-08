const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Story = require('../models/Story');
const Like = require('../models/Like');
const Bookmark = require('../models/Bookmark');
const Follow = require('../models/Follow');
const Comment = require('../models/Comment');
const cloudinary = require('../config/cloudinary');
const { extractHashtags } = require('../utils/parseText');
const { registerHashtags, unregisterHashtags } = require('../services/hashtagService');
const { notify } = require('../services/notificationService');

const MAX_PUBLISH_NOTIFY = 100; // cap fan-out so a big-follower account can't create a notification storm

// Attaches isLiked / isSaved flags for the requesting user (if authenticated) without N+1 queries.
const attachViewerFlags = async (stories, userId) => {
  const plain = stories.map((s) => (s.toPublicObject ? s.toPublicObject() : s));
  if (!userId) return plain.map((s) => ({ ...s, isLiked: false, isSaved: false }));

  const ids = plain.map((s) => s._id);
  const [likes, saves] = await Promise.all([
    Like.find({ user: userId, targetType: 'story', targetId: { $in: ids } }).select('targetId'),
    Bookmark.find({ user: userId, resourceType: 'story', resourceId: { $in: ids } }).select('resourceId'),
  ]);
  const likedSet = new Set(likes.map((l) => String(l.targetId)));
  const savedSet = new Set(saves.map((s) => String(s.resourceId)));

  return plain.map((s) => ({
    ...s,
    isLiked: likedSet.has(String(s._id)),
    isSaved: savedSet.has(String(s._id)),
  }));
};

const paginate = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 30);
  return { page, limit, skip: (page - 1) * limit };
};

// @desc    Create a story (draft or published)
// @route   POST /api/stories
// @access  Private
const createStory = asyncHandler(async (req, res) => {
  const { title, description, category, status } = req.body;
  const hashtagsFromBody = Array.isArray(req.body.hashtags)
    ? req.body.hashtags
    : typeof req.body.hashtags === 'string' && req.body.hashtags.length
    ? req.body.hashtags.split(',').map((t) => t.trim())
    : [];
  const hashtags = [...new Set([...hashtagsFromBody, ...extractHashtags(description)].map((t) => t.toLowerCase()))];

  const images = (req.files?.images || []).map((f) => ({ url: f.path, publicId: f.filename }));
  const videoFile = req.files?.video?.[0];

  const finalStatus = status === 'published' ? 'published' : 'draft';

  const story = await Story.create({
    author: req.user._id,
    title,
    description,
    category,
    hashtags,
    images,
    video: videoFile ? { url: videoFile.path, publicId: videoFile.filename } : undefined,
    status: finalStatus,
    publishedAt: finalStatus === 'published' ? new Date() : undefined,
  });

  if (finalStatus === 'published') {
    await registerHashtags(hashtags);
    const followers = await Follow.find({ following: req.user._id }).limit(MAX_PUBLISH_NOTIFY).select('follower');
    await Promise.all(
      followers.map((f) =>
        notify({
          recipient: f.follower,
          actor: req.user._id,
          type: 'publish',
          message: `${req.user.name} published a new story: "${story.title}"`,
          story: story._id,
        })
      )
    );
  }

  res.status(201).json({ success: true, data: story.toPublicObject() });
});

// @desc    Update a story (owner only)
// @route   PATCH /api/stories/:id
// @access  Private
const updateStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) {
    res.status(404);
    throw new Error('Story not found');
  }
  if (String(story.author) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only edit your own stories');
  }

  const editableFields = ['title', 'description', 'category'];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) story[field] = req.body[field];
  });

  if (req.body.hashtags !== undefined) {
    const raw = Array.isArray(req.body.hashtags) ? req.body.hashtags : req.body.hashtags.split(',');
    const newTags = [...new Set(raw.map((t) => t.trim().toLowerCase()).filter(Boolean))];
    await unregisterHashtags(story.hashtags);
    await registerHashtags(newTags);
    story.hashtags = newTags;
  }

  if (req.files?.images?.length) {
    // Replace the image set entirely on edit; clean up old Cloudinary assets.
    await Promise.all(story.images.map((img) => cloudinary.uploader.destroy(img.publicId).catch(() => {})));
    story.images = req.files.images.map((f) => ({ url: f.path, publicId: f.filename }));
  }
  if (req.files?.video?.[0]) {
    if (story.video?.publicId) {
      await cloudinary.uploader.destroy(story.video.publicId, { resource_type: 'video' }).catch(() => {});
    }
    const v = req.files.video[0];
    story.video = { url: v.path, publicId: v.filename };
  }

  const wasPublished = story.status === 'published';
  if (req.body.status === 'published' && !wasPublished) {
    story.status = 'published';
    story.publishedAt = new Date();
  }

  await story.save();
  res.json({ success: true, data: story.toPublicObject() });
});

// @desc    Archive a story (owner only) — a soft, reversible unpublish
// @route   PATCH /api/stories/:id/archive
// @access  Private
const archiveStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) {
    res.status(404);
    throw new Error('Story not found');
  }
  if (String(story.author) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only archive your own stories');
  }
  story.status = 'archived';
  await story.save();
  res.json({ success: true, message: 'Story archived' });
});

// @desc    Pin / unpin a story on the author's profile (max 3 pinned, enforced here)
// @route   PATCH /api/stories/:id/pin
// @access  Private
const togglePin = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) {
    res.status(404);
    throw new Error('Story not found');
  }
  if (String(story.author) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only pin your own stories');
  }

  if (!story.pinned) {
    const pinnedCount = await Story.countDocuments({ author: req.user._id, pinned: true });
    if (pinnedCount >= 3) {
      res.status(400);
      throw new Error('You can only pin up to 3 stories. Unpin one first.');
    }
  }

  story.pinned = !story.pinned;
  await story.save();
  res.json({ success: true, data: { pinned: story.pinned } });
});

// @desc    Delete a story (owner only)
// @route   DELETE /api/stories/:id
// @access  Private
const deleteStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) {
    res.status(404);
    throw new Error('Story not found');
  }
  if (String(story.author) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only delete your own stories');
  }

  await Promise.all(story.images.map((img) => cloudinary.uploader.destroy(img.publicId).catch(() => {})));
  if (story.video?.publicId) {
    await cloudinary.uploader.destroy(story.video.publicId, { resource_type: 'video' }).catch(() => {});
  }
  await unregisterHashtags(story.hashtags);
  await Promise.all([
    Comment.deleteMany({ story: story._id }),
    Like.deleteMany({ targetType: 'story', targetId: story._id }),
    Bookmark.deleteMany({ resourceType: 'story', resourceId: story._id }),
  ]);
  await story.deleteOne();

  res.json({ success: true, message: 'Story deleted' });
});

// @desc    Get a single story by id (increments view count for non-owners)
// @route   GET /api/stories/:id
// @access  Public
const getStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id).populate('author', 'name username avatar headline role');
  if (!story || (story.status !== 'published' && String(story.author._id) !== String(req.user?._id))) {
    res.status(404);
    throw new Error('Story not found');
  }

  if (!req.user || String(story.author._id) !== String(req.user._id)) {
    story.viewCount += 1;
    await story.save();
  }

  const [withFlags] = await attachViewerFlags([story], req.user?._id);
  res.json({ success: true, data: withFlags });
});

// @desc    Feed — newest | trending | most-liked | following | recommended
// @route   GET /api/stories/feed?sort=newest&page=&limit=&category=
// @access  Public (following/recommended require auth)
const getFeed = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const sort = req.query.sort || 'newest';
  const filter = { status: 'published' };
  if (req.query.category) filter.category = req.query.category;

  let stories = [];
  let total = 0;

  if (sort === 'following') {
    if (!req.user) {
      res.status(401);
      throw new Error('Log in to see stories from people you follow');
    }
    const follows = await Follow.find({ follower: req.user._id }).select('following');
    filter.author = { $in: follows.map((f) => f.following) };
    [stories, total] = await Promise.all([
      Story.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(limit).populate('author', 'name username avatar headline'),
      Story.countDocuments(filter),
    ]);
  } else if (sort === 'trending') {
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const matchStage = { ...filter, publishedAt: { $gte: since } };
    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ['$likesCount', 3] },
              { $multiply: ['$commentsCount', 2] },
              { $multiply: ['$sharesCount', 2] },
              '$savesCount',
            ],
          },
        },
      },
      { $sort: { score: -1, publishedAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];
    const raw = await Story.aggregate(pipeline);
    stories = await Story.populate(raw, { path: 'author', select: 'name username avatar headline' });
    stories = stories.map((s) => Story.hydrate(s));
    total = await Story.countDocuments(matchStage);
  } else if (sort === 'recommended') {
    if (!req.user) {
      res.status(401);
      throw new Error('Log in for a personalized feed');
    }
    const [likedIds, savedIds] = await Promise.all([
      Like.find({ user: req.user._id, targetType: 'story' }).limit(50).select('targetId'),
      Bookmark.find({ user: req.user._id, resourceType: 'story' }).limit(50).select('resourceId'),
    ]);
    const interactedIds = [...likedIds.map((l) => l.targetId), ...savedIds.map((s) => s.resourceId)];
    const interactedStories = await Story.find({ _id: { $in: interactedIds } }).select('category');
    const categoryFreq = {};
    interactedStories.forEach((s) => {
      categoryFreq[s.category] = (categoryFreq[s.category] || 0) + 1;
    });
    const topCategories = Object.entries(categoryFreq)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat)
      .slice(0, 3);

    if (topCategories.length) {
      filter.category = { $in: topCategories };
      filter.author = { $ne: req.user._id };
      [stories, total] = await Promise.all([
        Story.find(filter).sort({ likesCount: -1, publishedAt: -1 }).skip(skip).limit(limit).populate('author', 'name username avatar headline'),
        Story.countDocuments(filter),
      ]);
    } else {
      // New user with no interaction history yet — fall back to trending-ish (most liked overall).
      [stories, total] = await Promise.all([
        Story.find(filter).sort({ likesCount: -1, publishedAt: -1 }).skip(skip).limit(limit).populate('author', 'name username avatar headline'),
        Story.countDocuments(filter),
      ]);
    }
  } else if (sort === 'most-liked') {
    [stories, total] = await Promise.all([
      Story.find(filter).sort({ likesCount: -1, publishedAt: -1 }).skip(skip).limit(limit).populate('author', 'name username avatar headline'),
      Story.countDocuments(filter),
    ]);
  } else {
    // newest
    [stories, total] = await Promise.all([
      Story.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(limit).populate('author', 'name username avatar headline'),
      Story.countDocuments(filter),
    ]);
  }

  const withFlags = await attachViewerFlags(stories, req.user?._id);

  res.json({
    success: true,
    data: withFlags,
    pagination: { page, limit, total, pages: Math.ceil(total / limit), hasMore: skip + stories.length < total },
  });
});

// @desc    Stories authored by a specific user (published, unless it's the owner viewing)
// @route   GET /api/stories/user/:userId?status=
// @access  Public
const getUserStories = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const isOwner = req.user && String(req.user._id) === req.params.userId;

  const filter = { author: req.params.userId };
  filter.status = isOwner && req.query.status ? req.query.status : 'published';

  const [stories, total] = await Promise.all([
    Story.find(filter).sort({ pinned: -1, publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit),
    Story.countDocuments(filter),
  ]);

  const withFlags = await attachViewerFlags(stories, req.user?._id);
  res.json({
    success: true,
    data: withFlags,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Search stories (title/description/hashtags)
// @route   GET /api/stories/search?q=
// @access  Public
const searchStories = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const q = (req.query.q || '').trim();
  if (!q) {
    res.status(400);
    throw new Error('Search query is required');
  }

  const filter = { status: 'published', $text: { $search: q } };
  const [stories, total] = await Promise.all([
    Story.find(filter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name username avatar headline'),
    Story.countDocuments(filter),
  ]);

  const withFlags = await attachViewerFlags(stories, req.user?._id);
  res.json({ success: true, data: withFlags, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const listCategories = asyncHandler(async (req, res) => {
  res.json({ success: true, data: Story.CATEGORIES });
});

module.exports = {
  createStory,
  updateStory,
  archiveStory,
  togglePin,
  deleteStory,
  getStory,
  getFeed,
  getUserStories,
  searchStories,
  listCategories,
  attachViewerFlags,
};
