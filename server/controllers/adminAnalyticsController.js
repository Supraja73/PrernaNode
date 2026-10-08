const asyncHandler = require('express-async-handler');
const Community = require('../models/Community');
const Skill = require('../models/Skill');
const Business = require('../models/Business');
const Product = require('../models/Product');
const Story = require('../models/Story');
const User = require('../models/User');

// @desc    Top performers across the platform — all from real aggregations
// @route   GET /api/admin/analytics/top
// @access  Private (admin)
const topPerformers = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 30);

  const [topCommunities, topMentors, topBusinesses, topProducts, trendingStories] = await Promise.all([
    Community.find({ isActive: true }).sort({ memberCount: -1 }).limit(limit).select('name memberCount category'),
    Skill.find({ isActive: true }).sort({ averageRating: -1, totalStudents: -1 }).limit(limit).populate('mentor', 'name username').select('skillName averageRating totalStudents mentor'),
    Business.find({ isActive: true }).sort({ averageRating: -1 }).limit(limit).select('businessName averageRating followers').lean(),
    Product.find({ status: 'active' }).sort({ viewCount: -1 }).limit(limit).select('name viewCount savesCount'),
    Story.find({ status: 'published' }).sort({ likesCount: -1 }).limit(limit).select('title likesCount commentsCount author').populate('author', 'name username'),
  ]);

  res.json({
    success: true,
    data: {
      topCommunities,
      topMentors,
      topBusinesses: topBusinesses.map((b) => ({ ...b, followersCount: b.followers?.length || 0, followers: undefined })),
      topProducts,
      trendingStories,
    },
  });
});

// @desc    Most active users by content creation volume (real, computed, not stored)
// @route   GET /api/admin/analytics/active-users
// @access  Private (admin)
const mostActiveUsers = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 30);
  const agg = await Story.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: '$author', storyCount: { $sum: 1 }, totalLikes: { $sum: '$likesCount' } } },
    { $sort: { storyCount: -1, totalLikes: -1 } },
    { $limit: limit },
  ]);
  const users = await User.find({ _id: { $in: agg.map((a) => a._id) } }).select('name username avatar');
  const map = new Map(agg.map((a) => [String(a._id), a]));
  const data = users
    .map((u) => ({ user: u, storyCount: map.get(String(u._id))?.storyCount || 0, totalLikes: map.get(String(u._id))?.totalLikes || 0 }))
    .sort((a, b) => b.storyCount - a.storyCount);
  res.json({ success: true, data });
});

// @desc    Platform-wide engagement rate — (likes + comments + shares) / published stories
// @route   GET /api/admin/analytics/engagement
// @access  Private (admin)
const engagementRate = asyncHandler(async (req, res) => {
  const agg = await Story.aggregate([
    { $match: { status: 'published' } },
    {
      $group: {
        _id: null,
        totalStories: { $sum: 1 },
        totalLikes: { $sum: '$likesCount' },
        totalComments: { $sum: '$commentsCount' },
        totalShares: { $sum: '$sharesCount' },
        totalViews: { $sum: '$viewCount' },
      },
    },
  ]);
  const stats = agg[0] || { totalStories: 0, totalLikes: 0, totalComments: 0, totalShares: 0, totalViews: 0 };
  const engagementEvents = stats.totalLikes + stats.totalComments + stats.totalShares;
  const rate = stats.totalStories > 0 ? Math.round((engagementEvents / stats.totalStories) * 100) / 100 : 0;

  res.json({ success: true, data: { ...stats, engagementEventsPerStory: rate } });
});

// @desc    Daily activity for the last 30 days (new users + new stories) — real counts
// @route   GET /api/admin/analytics/daily-activity
// @access  Private (admin)
const dailyActivity = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dailyCount = async (Model, dateField = 'createdAt') =>
    Model.aggregate([
      { $match: { [dateField]: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: `$${dateField}` } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

  const [users, stories] = await Promise.all([dailyCount(User), dailyCount(Story, 'publishedAt')]);
  res.json({
    success: true,
    data: {
      newUsersPerDay: users.map((u) => ({ date: u._id, count: u.count })),
      newStoriesPerDay: stories.map((s) => ({ date: s._id, count: s.count })),
    },
  });
});

module.exports = { topPerformers, mostActiveUsers, engagementRate, dailyActivity };
