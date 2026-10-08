const asyncHandler = require('express-async-handler');
const Comment = require('../models/Comment');
const Story = require('../models/Story');
const Like = require('../models/Like');
const User = require('../models/User');
const { extractMentionHandles } = require('../utils/parseText');
const { notify } = require('../services/notificationService');

const paginate = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  return { page, limit, skip: (page - 1) * limit };
};

// @desc    Add a comment or a nested reply
// @route   POST /api/stories/:storyId/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.storyId);
  if (!story) {
    res.status(404);
    throw new Error('Story not found');
  }

  const { content, parent } = req.body;

  let parentComment = null;
  if (parent) {
    parentComment = await Comment.findById(parent);
    if (!parentComment || String(parentComment.story) !== String(story._id)) {
      res.status(400);
      throw new Error('Invalid parent comment');
    }
  }

  const handles = extractMentionHandles(content);
  const mentionedUsers = handles.length ? await User.find({ username: { $in: handles } }).select('_id username') : [];

  const comment = await Comment.create({
    story: story._id,
    author: req.user._id,
    parent: parentComment ? parentComment._id : null,
    content,
    mentions: mentionedUsers.map((u) => u._id),
  });

  story.commentsCount += 1;
  await story.save();

  if (parentComment) {
    parentComment.repliesCount += 1;
    await parentComment.save();
    await notify({
      recipient: parentComment.author,
      actor: req.user._id,
      type: 'reply',
      message: `${req.user.name} replied to your comment`,
      story: story._id,
      comment: comment._id,
    });
  } else {
    await notify({
      recipient: story.author,
      actor: req.user._id,
      type: 'comment',
      message: `${req.user.name} commented on your story "${story.title}"`,
      story: story._id,
      comment: comment._id,
    });
  }

  await Promise.all(
    mentionedUsers.map((u) =>
      notify({
        recipient: u._id,
        actor: req.user._id,
        type: 'mention',
        message: `${req.user.name} mentioned you in a comment`,
        story: story._id,
        comment: comment._id,
      })
    )
  );

  const populated = await comment.populate('author', 'name username avatar');
  res.status(201).json({ success: true, data: populated });
});

// @desc    List top-level comments for a story (paginated), with a page of replies per comment
// @route   GET /api/stories/:storyId/comments
// @access  Public
const listComments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = { story: req.params.storyId, parent: null };

  const [comments, total] = await Promise.all([
    Comment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('author', 'name username avatar'),
    Comment.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: comments,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    List replies to a specific comment
// @route   GET /api/comments/:id/replies
// @access  Public
const listReplies = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = { parent: req.params.id };

  const [replies, total] = await Promise.all([
    Comment.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit).populate('author', 'name username avatar'),
    Comment.countDocuments(filter),
  ]);

  res.json({ success: true, data: replies, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// @desc    Edit a comment (author only)
// @route   PATCH /api/comments/:id
// @access  Private
const editComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment || comment.deleted) {
    res.status(404);
    throw new Error('Comment not found');
  }
  if (String(comment.author) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only edit your own comments');
  }

  comment.content = req.body.content;
  comment.edited = true;
  await comment.save();

  res.json({ success: true, data: comment });
});

// @desc    Delete a comment (soft delete to preserve reply threads)
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment || comment.deleted) {
    res.status(404);
    throw new Error('Comment not found');
  }
  if (String(comment.author) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only delete your own comments');
  }

  comment.deleted = true;
  comment.content = '[deleted]';
  await comment.save();

  await Story.findByIdAndUpdate(comment.story, { $inc: { commentsCount: -1 } });
  await Like.deleteMany({ targetType: 'comment', targetId: comment._id });

  res.json({ success: true, message: 'Comment deleted' });
});

// @desc    Like a comment
// @route   POST /api/comments/:id/like
// @access  Private
const likeComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment || comment.deleted) {
    res.status(404);
    throw new Error('Comment not found');
  }

  try {
    await Like.create({ user: req.user._id, targetType: 'comment', targetId: comment._id });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409);
      throw new Error('Already liked');
    }
    throw err;
  }

  comment.likesCount += 1;
  await comment.save();

  await notify({
    recipient: comment.author,
    actor: req.user._id,
    type: 'like_comment',
    message: `${req.user.name} liked your comment`,
    story: comment.story,
    comment: comment._id,
  });

  res.json({ success: true, data: { likesCount: comment.likesCount } });
});

// @desc    Unlike a comment
// @route   DELETE /api/comments/:id/like
// @access  Private
const unlikeComment = asyncHandler(async (req, res) => {
  const result = await Like.findOneAndDelete({ user: req.user._id, targetType: 'comment', targetId: req.params.id });
  if (!result) {
    res.status(404);
    throw new Error('You have not liked this comment');
  }
  const comment = await Comment.findByIdAndUpdate(req.params.id, { $inc: { likesCount: -1 } }, { new: true });
  res.json({ success: true, data: { likesCount: comment?.likesCount ?? 0 } });
});

module.exports = {
  addComment,
  listComments,
  listReplies,
  editComment,
  deleteComment,
  likeComment,
  unlikeComment,
};
