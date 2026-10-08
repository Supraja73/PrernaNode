const asyncHandler = require('express-async-handler');
const Community = require('../models/Community');
const CommunityMember = require('../models/CommunityMember');
const cloudinary = require('../config/cloudinary');
const { notify } = require('../services/notificationService');
const { getOrCreateCommunityChat } = require('../services/chatService');

const paginate = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 12, 30);
  return { page, limit, skip: (page - 1) * limit };
};

const singleFileFromReq = (req, field) => {
  const f = req.files?.[field]?.[0];
  return f ? { url: f.path, publicId: f.filename } : undefined;
};

const slugify = (name) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).slice(2, 7);

// @desc    Create a community
// @route   POST /api/communities
// @access  Private
const createCommunity = asyncHandler(async (req, res) => {
  const body = req.body;
  const tags = typeof body.tags === 'string' ? body.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : [];
  const rules = typeof body.rules === 'string' ? body.rules.split('\n').map((r) => r.trim()).filter(Boolean) : [];

  const community = await Community.create({
    name: body.name,
    slug: slugify(body.name),
    description: body.description,
    rules,
    category: body.category,
    tags,
    visibility: body.visibility || 'public',
    owner: req.user._id,
    banner: singleFileFromReq(req, 'banner'),
    logo: singleFileFromReq(req, 'logo'),
  });

  await CommunityMember.create({ community: community._id, user: req.user._id, role: 'owner', status: 'active' });
  await getOrCreateCommunityChat(community._id, req.user._id, community.name);

  res.status(201).json({ success: true, data: community });
});

// @desc    Update a community (owner/moderator)
// @route   PATCH /api/communities/:id
// @access  Private
const updateCommunity = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }
  const isOwnerOrMod = String(community.owner) === String(req.user._id) || community.moderators.some((m) => String(m) === String(req.user._id));
  if (!isOwnerOrMod) {
    res.status(403);
    throw new Error('Only the owner or moderators can edit this community');
  }

  const body = req.body;
  ['name', 'description', 'category', 'visibility'].forEach((f) => {
    if (body[f] !== undefined) community[f] = body[f];
  });
  if (body.tags !== undefined) community.tags = typeof body.tags === 'string' ? body.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : body.tags;
  if (body.rules !== undefined) community.rules = typeof body.rules === 'string' ? body.rules.split('\n').map((r) => r.trim()).filter(Boolean) : body.rules;

  if (req.files?.banner?.[0]) {
    if (community.banner?.publicId) await cloudinary.uploader.destroy(community.banner.publicId).catch(() => {});
    community.banner = singleFileFromReq(req, 'banner');
  }
  if (req.files?.logo?.[0]) {
    if (community.logo?.publicId) await cloudinary.uploader.destroy(community.logo.publicId).catch(() => {});
    community.logo = singleFileFromReq(req, 'logo');
  }

  await community.save();
  res.json({ success: true, data: community });
});

// @desc    Delete a community (owner only)
// @route   DELETE /api/communities/:id
// @access  Private
const deleteCommunity = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }
  if (String(community.owner) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Only the owner can delete this community');
  }

  if (community.banner?.publicId) await cloudinary.uploader.destroy(community.banner.publicId).catch(() => {});
  if (community.logo?.publicId) await cloudinary.uploader.destroy(community.logo.publicId).catch(() => {});
  await CommunityMember.deleteMany({ community: community._id });
  await community.deleteOne();

  res.json({ success: true, message: 'Community deleted' });
});

// @desc    Get a community + the viewer's membership status
// @route   GET /api/communities/:id
// @access  Public
const getCommunity = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id).populate('owner', 'name username avatar').populate('moderators', 'name username avatar');
  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }

  let membership = null;
  if (req.user) {
    membership = await CommunityMember.findOne({ community: community._id, user: req.user._id });
  }

  res.json({ success: true, data: { ...community.toObject(), viewerMembership: membership } });
});

// @desc    Browse/search communities
// @route   GET /api/communities?category=&q=&page=&limit=
// @access  Public
const listCommunities = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const q = req.query;
  const filter = { isActive: true, visibility: { $ne: 'invite-only' } };
  if (q.category) filter.category = q.category;
  if (q.q) filter.$text = { $search: q.q };

  const [communities, total] = await Promise.all([
    Community.find(filter).sort({ memberCount: -1, createdAt: -1 }).skip(skip).limit(limit).populate('owner', 'name username avatar'),
    Community.countDocuments(filter),
  ]);

  res.json({ success: true, data: communities, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const listCategories = asyncHandler(async (req, res) => {
  res.json({ success: true, data: Community.CATEGORIES });
});

// @desc    Join a community (instant for public, pending for private/invite-only)
// @route   POST /api/communities/:id/join
// @access  Private
const joinCommunity = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }

  const existing = await CommunityMember.findOne({ community: community._id, user: req.user._id });
  if (existing) {
    res.status(409);
    throw new Error('You already requested or joined this community');
  }

  const status = community.visibility === 'public' ? 'active' : 'pending';
  await CommunityMember.create({ community: community._id, user: req.user._id, status });

  if (status === 'active') {
    community.memberCount += 1;
    await community.save();
    const chat = await getOrCreateCommunityChat(community._id, community.owner, community.name);
    chat.participants.addToSet(req.user._id);
    await chat.save();
  } else {
    await notify({ recipient: community.owner, actor: req.user._id, type: 'community_join_request', message: `${req.user.name} requested to join ${community.name}`, refModel: 'Community', refId: community._id });
  }

  res.json({ success: true, data: { status } });
});

// @desc    Leave a community
// @route   DELETE /api/communities/:id/join
// @access  Private
const leaveCommunity = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }
  if (String(community.owner) === String(req.user._id)) {
    res.status(400);
    throw new Error('The owner cannot leave their own community — transfer ownership or delete it instead');
  }

  const membership = await CommunityMember.findOneAndDelete({ community: community._id, user: req.user._id, status: 'active' });
  if (membership) {
    community.memberCount = Math.max(0, community.memberCount - 1);
    await community.save();
    const chat = await getOrCreateCommunityChat(community._id, community.owner, community.name);
    chat.participants = chat.participants.filter((p) => String(p) !== String(req.user._id));
    await chat.save();
  }

  res.json({ success: true, message: 'Left community' });
});

// @desc    Approve/reject a pending join request (owner/moderator)
// @route   PATCH /api/communities/:id/requests/:userId
// @access  Private
const respondToJoinRequest = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }
  const isOwnerOrMod = String(community.owner) === String(req.user._id) || community.moderators.some((m) => String(m) === String(req.user._id));
  if (!isOwnerOrMod) {
    res.status(403);
    throw new Error('Only the owner or moderators can manage join requests');
  }

  const membership = await CommunityMember.findOne({ community: community._id, user: req.params.userId, status: 'pending' });
  if (!membership) {
    res.status(404);
    throw new Error('Join request not found');
  }

  const { action } = req.body; // 'accept' | 'reject'
  if (action === 'accept') {
    membership.status = 'active';
    await membership.save();
    community.memberCount += 1;
    await community.save();
    const chat = await getOrCreateCommunityChat(community._id, community.owner, community.name);
    chat.participants.addToSet(req.params.userId);
    await chat.save();
    await notify({ recipient: req.params.userId, actor: req.user._id, type: 'community_join_accepted', message: `Your request to join ${community.name} was accepted`, refModel: 'Community', refId: community._id });
  } else {
    await membership.deleteOne();
    await notify({ recipient: req.params.userId, actor: req.user._id, type: 'community_join_rejected', message: `Your request to join ${community.name} was declined`, refModel: 'Community', refId: community._id });
  }

  res.json({ success: true, message: `Request ${action}ed` });
});

// @desc    List pending join requests (owner/moderator)
// @route   GET /api/communities/:id/requests
// @access  Private
const listJoinRequests = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }
  const isOwnerOrMod = String(community.owner) === String(req.user._id) || community.moderators.some((m) => String(m) === String(req.user._id));
  if (!isOwnerOrMod) {
    res.status(403);
    throw new Error('Only the owner or moderators can view join requests');
  }

  const requests = await CommunityMember.find({ community: community._id, status: 'pending' }).populate('user', 'name username avatar headline');
  res.json({ success: true, data: requests });
});

// @desc    List members of a community
// @route   GET /api/communities/:id/members
// @access  Public
const listMembers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = { community: req.params.id, status: 'active' };
  const [members, total] = await Promise.all([
    CommunityMember.find(filter).sort({ role: 1, createdAt: 1 }).skip(skip).limit(limit).populate('user', 'name username avatar headline'),
    CommunityMember.countDocuments(filter),
  ]);
  res.json({ success: true, data: members, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// @desc    Promote/demote a member to moderator (owner only)
// @route   PATCH /api/communities/:id/members/:userId/role
// @access  Private
const setModerator = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }
  if (String(community.owner) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Only the owner can manage moderators');
  }

  const { makeModerator } = req.body;
  const membership = await CommunityMember.findOne({ community: community._id, user: req.params.userId, status: 'active' });
  if (!membership) {
    res.status(404);
    throw new Error('Member not found');
  }

  membership.role = makeModerator ? 'moderator' : 'member';
  await membership.save();

  if (makeModerator) {
    community.moderators.addToSet(req.params.userId);
  } else {
    community.moderators.pull(req.params.userId);
  }
  await community.save();

  res.json({ success: true, data: { role: membership.role } });
});

// @desc    Report a community
// @route   POST /api/communities/:id/report
// @access  Private
const reportCommunity = asyncHandler(async (req, res) => {
  const community = await Community.findByIdAndUpdate(req.params.id, { $inc: { reportsCount: 1 } }, { new: true });
  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }
  res.json({ success: true, message: 'Community reported. Our team will review it.' });
});

// @desc    Community analytics — real counts, no placeholders
// @route   GET /api/communities/:id/analytics
// @access  Private (owner/moderator)
const communityAnalytics = asyncHandler(async (req, res) => {
  const CommunityPost = require('../models/CommunityPost');
  const community = await Community.findById(req.params.id);
  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }
  const isOwnerOrMod = String(community.owner) === String(req.user._id) || community.moderators.some((m) => String(m) === String(req.user._id));
  if (!isOwnerOrMod) {
    res.status(403);
    throw new Error('Only the owner or moderators can view analytics');
  }

  const [postCount, memberGrowth, topPosts] = await Promise.all([
    CommunityPost.countDocuments({ community: community._id, hidden: false }),
    CommunityMember.aggregate([
      { $match: { community: community._id, status: 'active' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
    CommunityPost.find({ community: community._id, hidden: false }).sort({ likesCount: -1 }).limit(5).select('content likesCount commentsCount'),
  ]);

  res.json({
    success: true,
    data: {
      memberCount: community.memberCount,
      postCount,
      memberGrowthByMonth: memberGrowth.map((m) => ({ month: m._id, count: m.count })),
      topPosts,
    },
  });
});

// @desc    Get (or lazily create) this community's group chat — members only
// @route   GET /api/communities/:id/chat
// @access  Private
const getCommunityChat = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }
  const membership = await CommunityMember.findOne({ community: community._id, user: req.user._id, status: 'active' });
  if (!membership) {
    res.status(403);
    throw new Error('Only members can access the community chat');
  }

  const chat = await getOrCreateCommunityChat(community._id, community.owner, community.name);
  if (!chat.participants.some((p) => String(p) === String(req.user._id))) {
    chat.participants.push(req.user._id);
    await chat.save();
  }

  res.json({ success: true, data: { chatId: chat._id } });
});

module.exports = {
  createCommunity, updateCommunity, deleteCommunity, getCommunity, listCommunities, listCategories,
  joinCommunity, leaveCommunity, respondToJoinRequest, listJoinRequests, listMembers, setModerator,
  reportCommunity, communityAnalytics, getCommunityChat,
};
