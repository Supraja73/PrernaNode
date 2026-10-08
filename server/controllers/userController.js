const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

// @desc    Get a public user profile
// @route   GET /api/users/:id
// @access  Public
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('followers', 'name avatar headline')
    .populate('following', 'name avatar headline');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({ success: true, data: user.toSafeObject() });
});

// @desc    Update the logged-in user's profile
// @route   PATCH /api/users/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const editableFields = [
    'name',
    'headline',
    'bio',
    'location',
    'languages',
    'interests',
    'skills',
    'education',
    'experience',
    'socialLinks',
  ];

  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      req.user[field] = req.body[field];
    }
  });

  const updated = await req.user.save();
  res.json({ success: true, data: updated.toSafeObject() });
});

// @desc    Upload / replace avatar
// @route   POST /api/users/me/avatar
// @access  Private
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file provided');
  }

  // Clean up the old avatar in Cloudinary, if any
  if (req.user.avatar?.publicId) {
    await cloudinary.uploader.destroy(req.user.avatar.publicId).catch(() => {});
  }

  req.user.avatar = { url: req.file.path, publicId: req.file.filename };
  await req.user.save();

  res.json({ success: true, data: { avatar: req.user.avatar } });
});

// @desc    Upload / replace cover image
// @route   POST /api/users/me/cover
// @access  Private
const uploadCover = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file provided');
  }

  if (req.user.cover?.publicId) {
    await cloudinary.uploader.destroy(req.user.cover.publicId).catch(() => {});
  }

  req.user.cover = { url: req.file.path, publicId: req.file.filename };
  await req.user.save();

  res.json({ success: true, data: { cover: req.user.cover } });
});

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
const followUser = asyncHandler(async (req, res) => {
  if (req.params.id === String(req.user._id)) {
    res.status(400);
    throw new Error('You cannot follow yourself');
  }

  const target = await User.findById(req.params.id);
  if (!target) {
    res.status(404);
    throw new Error('User not found');
  }

  const alreadyFollowing = req.user.following.some((id) => String(id) === String(target._id));
  if (alreadyFollowing) {
    res.status(409);
    throw new Error('Already following this user');
  }

  req.user.following.push(target._id);
  target.followers.push(req.user._id);

  await Promise.all([req.user.save(), target.save()]);

  res.json({ success: true, message: `You are now following ${target.name}` });
});

// @desc    Unfollow a user
// @route   DELETE /api/users/:id/follow
// @access  Private
const unfollowUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) {
    res.status(404);
    throw new Error('User not found');
  }

  req.user.following = req.user.following.filter((id) => String(id) !== String(target._id));
  target.followers = target.followers.filter((id) => String(id) !== String(req.user._id));

  await Promise.all([req.user.save(), target.save()]);

  res.json({ success: true, message: `You unfollowed ${target.name}` });
});

// @desc    Search / list users (basic, paginated)
// @route   GET /api/users?search=&page=&limit=
// @access  Public
const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).select('name username avatar headline role location'),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Public profile by username, enriched for Part 2 (pinned/recent stories,
//          Follow-collection counts, mutuals when logged in). Additive — does not
//          replace the existing getUserById used by Part 1.
// @route   GET /api/users/u/:username
// @access  Public
const getUserByUsername = asyncHandler(async (req, res) => {
  const Story = require('../models/Story');
  const Follow = require('../models/Follow');

  const user = await User.findOne({ username: req.params.username.toLowerCase() });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const [pinnedStories, recentStories, followersCount, followingCount, isFollowing] = await Promise.all([
    Story.find({ author: user._id, status: 'published', pinned: true }).sort({ updatedAt: -1 }),
    Story.find({ author: user._id, status: 'published' }).sort({ publishedAt: -1 }).limit(10),
    Follow.countDocuments({ following: user._id }),
    Follow.countDocuments({ follower: user._id }),
    req.user ? Follow.exists({ follower: req.user._id, following: user._id }) : null,
  ]);

  res.json({
    success: true,
    data: {
      ...user.toSafeObject(),
      followersCount,
      followingCount,
      isFollowing: !!isFollowing,
      pinnedStories,
      recentStories,
    },
  });
});

module.exports = {
  getUserById,
  getUserByUsername,
  updateMe,
  uploadAvatar,
  uploadCover,
  followUser,
  unfollowUser,
  listUsers,
};
