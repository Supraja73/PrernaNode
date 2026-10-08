const asyncHandler = require('express-async-handler');
const CommunityPost = require('../models/CommunityPost');
const CommunityPostComment = require('../models/CommunityPostComment');
const CommunityMember = require('../models/CommunityMember');
const Community = require('../models/Community');
const Like = require('../models/Like');
const { notify } = require('../services/notificationService');

const paginate = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 30);
  return { page, limit, skip: (page - 1) * limit };
};

const filesFromReq = (req) => (req.files?.images || []).map((f) => ({ url: f.path, publicId: f.filename }));
const videoFromReq = (req) => {
  const f = req.files?.video?.[0];
  return f ? { url: f.path, publicId: f.filename } : undefined;
};

const assertActiveMember = async (communityId, userId) => {
  const membership = await CommunityMember.findOne({ community: communityId, user: userId, status: 'active' });
  if (!membership) {
    const err = new Error('You must be a member of this community to do that');
    err.statusCode = 403;
    throw err;
  }
  return membership;
};

// @desc    Create a post (or poll/question/discussion/resource) in a community
// @route   POST /api/community-posts/:communityId
// @access  Private (members only)
const createPost = asyncHandler(async (req, res) => {
  await assertActiveMember(req.params.communityId, req.user._id);

  const body = req.body;
  let poll;
  if (body.type === 'poll' && body.pollQuestion && body.pollOptions) {
    const options = (typeof body.pollOptions === 'string' ? body.pollOptions.split('|') : body.pollOptions).map((o) => ({ text: o.trim(), votes: [] }));
    poll = { question: body.pollQuestion, options, closesAt: body.pollClosesAt || undefined };
  }

  const post = await CommunityPost.create({
    community: req.params.communityId,
    author: req.user._id,
    type: body.type || 'post',
    content: body.content,
    images: filesFromReq(req),
    video: videoFromReq(req),
    poll,
  });

  const populated = await post.populate('author', 'name username avatar');
  res.status(201).json({ success: true, data: populated });
});

// @desc    Feed of posts within a community
// @route   GET /api/community-posts/:communityId?page=&limit=
// @access  Public
const listPosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = { community: req.params.communityId, hidden: false };

  const [posts, total] = await Promise.all([
    CommunityPost.find(filter).sort({ pinned: -1, createdAt: -1 }).skip(skip).limit(limit).populate('author', 'name username avatar'),
    CommunityPost.countDocuments(filter),
  ]);

  let withFlags = posts.map((p) => p.toObject());
  if (req.user) {
    const likes = await Like.find({ user: req.user._id, targetType: 'community_post', targetId: { $in: posts.map((p) => p._id) } });
    const likedSet = new Set(likes.map((l) => String(l.targetId)));
    withFlags = withFlags.map((p) => ({ ...p, isLiked: likedSet.has(String(p._id)) }));
  }

  res.json({ success: true, data: withFlags, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const getPost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id).populate('author', 'name username avatar');
  if (!post || post.hidden) {
    res.status(404);
    throw new Error('Post not found');
  }
  res.json({ success: true, data: post });
});

// @desc    Edit a post (author only)
// @route   PATCH /api/community-posts/:id
// @access  Private
const updatePost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  if (String(post.author) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only edit your own posts');
  }
  if (req.body.content !== undefined) post.content = req.body.content;
  await post.save();
  res.json({ success: true, data: post });
});

// @desc    Delete a post (author or community owner/moderator)
// @route   DELETE /api/community-posts/:id
// @access  Private
const deletePost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  const community = await Community.findById(post.community);
  const isAuthor = String(post.author) === String(req.user._id);
  const isOwnerOrMod = community && (String(community.owner) === String(req.user._id) || community.moderators.some((m) => String(m) === String(req.user._id)));
  if (!isAuthor && !isOwnerOrMod) {
    res.status(403);
    throw new Error('You cannot delete this post');
  }

  await CommunityPostComment.deleteMany({ post: post._id });
  await Like.deleteMany({ targetType: 'community_post', targetId: post._id });
  await post.deleteOne();
  res.json({ success: true, message: 'Post deleted' });
});

// @desc    Pin/unpin a post (owner/moderator)
// @route   PATCH /api/community-posts/:id/pin
// @access  Private
const togglePin = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  const community = await Community.findById(post.community);
  const isOwnerOrMod = community && (String(community.owner) === String(req.user._id) || community.moderators.some((m) => String(m) === String(req.user._id)));
  if (!isOwnerOrMod) {
    res.status(403);
    throw new Error('Only the owner or moderators can pin posts');
  }
  post.pinned = !post.pinned;
  await post.save();
  if (post.pinned) community.pinnedPosts.addToSet(post._id);
  else community.pinnedPosts.pull(post._id);
  await community.save();
  res.json({ success: true, data: { pinned: post.pinned } });
});

// @desc    Vote on a poll option
// @route   POST /api/community-posts/:id/vote
// @access  Private
const voteOnPoll = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post || post.type !== 'poll') {
    res.status(404);
    throw new Error('Poll not found');
  }
  const { optionIndex } = req.body;
  if (optionIndex === undefined || !post.poll.options[optionIndex]) {
    res.status(400);
    throw new Error('Invalid option');
  }

  post.poll.options.forEach((opt) => {
    opt.votes = opt.votes.filter((v) => String(v) !== String(req.user._id));
  });
  post.poll.options[optionIndex].votes.push(req.user._id);
  await post.save();

  res.json({ success: true, data: post.poll });
});

// @desc    Like / unlike a post
// @route   POST/DELETE /api/community-posts/:id/like
// @access  Private
const likePost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  try {
    await Like.create({ user: req.user._id, targetType: 'community_post', targetId: post._id });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409);
      throw new Error('Already liked');
    }
    throw err;
  }
  post.likesCount += 1;
  await post.save();
  await notify({ recipient: post.author, actor: req.user._id, type: 'like_story', message: `${req.user.name} liked your post`, refModel: 'CommunityPost', refId: post._id });
  res.json({ success: true, data: { likesCount: post.likesCount } });
});

const unlikePost = asyncHandler(async (req, res) => {
  const result = await Like.findOneAndDelete({ user: req.user._id, targetType: 'community_post', targetId: req.params.id });
  if (!result) {
    res.status(404);
    throw new Error('You have not liked this post');
  }
  const post = await CommunityPost.findByIdAndUpdate(req.params.id, { $inc: { likesCount: -1 } }, { new: true });
  res.json({ success: true, data: { likesCount: post?.likesCount ?? 0 } });
});

// @desc    Comment on a post
// @route   POST /api/community-posts/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  const comment = await CommunityPostComment.create({
    post: post._id,
    author: req.user._id,
    content: req.body.content,
    replyTo: req.body.replyTo || null,
  });
  post.commentsCount += 1;
  await post.save();

  await notify({ recipient: post.author, actor: req.user._id, type: 'comment', message: `${req.user.name} commented on your post`, refModel: 'CommunityPost', refId: post._id });

  const populated = await comment.populate('author', 'name username avatar');
  res.status(201).json({ success: true, data: populated });
});

const listComments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = { post: req.params.id, deleted: false };
  const [comments, total] = await Promise.all([
    CommunityPostComment.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit).populate('author', 'name username avatar'),
    CommunityPostComment.countDocuments(filter),
  ]);
  res.json({ success: true, data: comments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const deleteComment = asyncHandler(async (req, res) => {
  const comment = await CommunityPostComment.findById(req.params.commentId);
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }
  if (String(comment.author) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only delete your own comment');
  }
  comment.deleted = true;
  comment.content = '[deleted]';
  await comment.save();
  await CommunityPost.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });
  res.json({ success: true, message: 'Comment deleted' });
});

// @desc    Report a post
// @route   POST /api/community-posts/:id/report
// @access  Private
const reportPost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findByIdAndUpdate(req.params.id, { $inc: { reportsCount: 1 } }, { new: true });
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  if (post.reportsCount >= 5) {
    post.hidden = true;
    await post.save();
  }
  res.json({ success: true, message: 'Post reported' });
});

const shareCommunityPost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findByIdAndUpdate(req.params.id, { $inc: { sharesCount: 1 } }, { new: true });
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  res.json({ success: true, data: { sharesCount: post.sharesCount } });
});

module.exports = {
  createPost, listPosts, getPost, updatePost, deletePost, togglePin, voteOnPoll,
  likePost, unlikePost, addComment, listComments, deleteComment, reportPost, shareCommunityPost,
};
