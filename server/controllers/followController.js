const asyncHandler = require('express-async-handler');
const Follow = require('../models/Follow');
const User = require('../models/User');
const Story = require('../models/Story');
const { notify } = require('../services/notificationService');

const paginate = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  return { page, limit, skip: (page - 1) * limit };
};

// @desc    Follow a user
// @route   POST /api/follow/:userId
// @access  Private
const followUser = asyncHandler(async (req, res) => {
  if (String(req.params.userId) === String(req.user._id)) {
    res.status(400);
    throw new Error('You cannot follow yourself');
  }

  const target = await User.findById(req.params.userId);
  if (!target) {
    res.status(404);
    throw new Error('User not found');
  }

  try {
    await Follow.create({ follower: req.user._id, following: target._id });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409);
      throw new Error('Already following this user');
    }
    throw err;
  }

  await notify({
    recipient: target._id,
    actor: req.user._id,
    type: 'follow',
    message: `${req.user.name} started following you`,
  });

  const [followersCount, followingCount] = await Promise.all([
    Follow.countDocuments({ following: target._id }),
    Follow.countDocuments({ follower: req.user._id }),
  ]);

  res.json({ success: true, message: `You are now following ${target.name}`, data: { followersCount, followingCount } });
});

// @desc    Unfollow a user
// @route   DELETE /api/follow/:userId
// @access  Private
const unfollowUser = asyncHandler(async (req, res) => {
  const result = await Follow.findOneAndDelete({ follower: req.user._id, following: req.params.userId });
  if (!result) {
    res.status(404);
    throw new Error('You are not following this user');
  }

  const [followersCount, followingCount] = await Promise.all([
    Follow.countDocuments({ following: req.params.userId }),
    Follow.countDocuments({ follower: req.user._id }),
  ]);

  res.json({ success: true, message: 'Unfollowed', data: { followersCount, followingCount } });
});

// @desc    List a user's followers
// @route   GET /api/follow/:userId/followers
// @access  Public
const listFollowers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const [follows, total] = await Promise.all([
    Follow.find({ following: req.params.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('follower', 'name username avatar headline'),
    Follow.countDocuments({ following: req.params.userId }),
  ]);

  res.json({
    success: true,
    data: follows.map((f) => f.follower),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    List who a user is following
// @route   GET /api/follow/:userId/following
// @access  Public
const listFollowing = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const [follows, total] = await Promise.all([
    Follow.find({ follower: req.params.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('following', 'name username avatar headline'),
    Follow.countDocuments({ follower: req.params.userId }),
  ]);

  res.json({
    success: true,
    data: follows.map((f) => f.following),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Mutual followers between the logged-in user and another user
// @route   GET /api/follow/:userId/mutual
// @access  Private
const listMutualFollowers = asyncHandler(async (req, res) => {
  const [myFollowing, theirFollowers] = await Promise.all([
    Follow.find({ follower: req.user._id }).select('following'),
    Follow.find({ following: req.params.userId }).select('follower'),
  ]);
  const myFollowingSet = new Set(myFollowing.map((f) => String(f.following)));
  const mutualIds = theirFollowers.map((f) => f.follower).filter((id) => myFollowingSet.has(String(id)));

  const users = await User.find({ _id: { $in: mutualIds } }).select('name username avatar headline');
  res.json({ success: true, data: users });
});

// @desc    Suggested users to follow (popular creators not already followed)
// @route   GET /api/follow/suggestions
// @access  Private
const suggestUsers = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 30);

  const [alreadyFollowing, storyCounts] = await Promise.all([
    Follow.find({ follower: req.user._id }).select('following'),
    Story.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$author', publishedCount: { $sum: 1 }, totalLikes: { $sum: '$likesCount' } } },
      { $sort: { totalLikes: -1, publishedCount: -1 } },
      { $limit: limit * 3 },
    ]),
  ]);

  const excludeIds = new Set([String(req.user._id), ...alreadyFollowing.map((f) => String(f.following))]);
  const candidateIds = storyCounts.map((s) => s._id).filter((id) => !excludeIds.has(String(id)));

  let users = await User.find({ _id: { $in: candidateIds } })
    .select('name username avatar headline role')
    .limit(limit);

  if (users.length < limit) {
    // Not enough active creators yet — fill the rest with newest members.
    const fillIds = [...excludeIds, ...users.map((u) => String(u._id))];
    const extra = await User.find({ _id: { $nin: fillIds }, isVerified: true })
      .sort({ createdAt: -1 })
      .select('name username avatar headline role')
      .limit(limit - users.length);
    users = [...users, ...extra];
  }

  res.json({ success: true, data: users });
});

// @desc    Newest verified members
// @route   GET /api/follow/new-members
// @access  Public
const listNewMembers = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 30);
  const users = await User.find({ isVerified: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('name username avatar headline createdAt');
  res.json({ success: true, data: users });
});

module.exports = {
  followUser,
  unfollowUser,
  listFollowers,
  listFollowing,
  listMutualFollowers,
  suggestUsers,
  listNewMembers,
};
