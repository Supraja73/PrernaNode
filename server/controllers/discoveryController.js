const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Story = require('../models/Story');

// @desc    Popular creators — most total likes across their published stories
// @route   GET /api/discovery/popular-creators
// @access  Public
const popularCreators = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 30);

  const agg = await Story.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: '$author', totalLikes: { $sum: '$likesCount' }, storyCount: { $sum: 1 } } },
    { $sort: { totalLikes: -1 } },
    { $limit: limit },
  ]);

  const users = await User.find({ _id: { $in: agg.map((a) => a._id) } }).select(
    'name username avatar headline role'
  );
  const statsMap = new Map(agg.map((a) => [String(a._id), a]));
  const data = users
    .map((u) => ({ ...u.toSafeObject(), totalLikes: statsMap.get(String(u._id))?.totalLikes || 0, storyCount: statsMap.get(String(u._id))?.storyCount || 0 }))
    .sort((a, b) => b.totalLikes - a.totalLikes);

  res.json({ success: true, data });
});

// @desc    Trending mentors — mentors with the most followers gained recently is out of scope
//          without a follow-timestamp index scan; using total followers as the real, honest signal.
// @route   GET /api/discovery/trending-mentors
// @access  Public
const trendingMentors = asyncHandler(async (req, res) => {
  const Follow = require('../models/Follow');
  const limit = Math.min(parseInt(req.query.limit) || 10, 30);

  const agg = await Follow.aggregate([
    { $group: { _id: '$following', followerCount: { $sum: 1 } } },
    { $sort: { followerCount: -1 } },
    { $limit: limit * 2 },
  ]);

  const candidateIds = agg.map((a) => a._id);
  const mentors = await User.find({ _id: { $in: candidateIds }, role: 'mentor' }).select(
    'name username avatar headline'
  );
  const followerMap = new Map(agg.map((a) => [String(a._id), a.followerCount]));
  const data = mentors
    .map((m) => ({ ...m.toSafeObject(), followerCount: followerMap.get(String(m._id)) || 0 }))
    .sort((a, b) => b.followerCount - a.followerCount)
    .slice(0, limit);

  res.json({ success: true, data });
});

module.exports = { popularCreators, trendingMentors };
