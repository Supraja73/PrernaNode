const asyncHandler = require('express-async-handler');
const Hashtag = require('../models/Hashtag');
const Story = require('../models/Story');
const { attachViewerFlags } = require('./storyController');

// @desc    Trending hashtags
// @route   GET /api/hashtags/trending
// @access  Public
const trendingHashtags = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 15, 50);
  const hashtags = await Hashtag.find({ usageCount: { $gt: 0 } }).sort({ usageCount: -1, lastUsedAt: -1 }).limit(limit);
  res.json({ success: true, data: hashtags });
});

// @desc    Stories under a specific hashtag (paginated)
// @route   GET /api/hashtags/:tag
// @access  Public
const getHashtagPage = asyncHandler(async (req, res) => {
  const tag = req.params.tag.toLowerCase();
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 30);
  const skip = (page - 1) * limit;

  const filter = { status: 'published', hashtags: tag };
  const [stories, total, hashtagDoc] = await Promise.all([
    Story.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(limit).populate('author', 'name username avatar headline'),
    Story.countDocuments(filter),
    Hashtag.findOne({ tag }),
  ]);

  const withFlags = await attachViewerFlags(stories, req.user?._id);

  res.json({
    success: true,
    data: withFlags,
    tag,
    usageCount: hashtagDoc?.usageCount || total,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

module.exports = { trendingHashtags, getHashtagPage };
