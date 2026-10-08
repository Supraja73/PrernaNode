const asyncHandler = require('express-async-handler');
const { recordAudit } = require('../services/auditService');
const { notify } = require('../services/notificationService');

const Story = require('../models/Story');
const Comment = require('../models/Comment');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Community = require('../models/Community');
const CommunityPost = require('../models/CommunityPost');
const Business = require('../models/Business');
const Event = require('../models/Event');
const Collaboration = require('../models/Collaboration');
const ChatMessage = require('../models/ChatMessage');
const AIHistory = require('../models/AIHistory');

// Maps each content type to how THAT model already represents "hidden"/"visible" —
// deliberately reuses existing fields (Story.status, Comment.deleted, Review.hidden,
// Product.status, Community.isActive, CommunityPost.hidden, Business.isActive,
// Event.hidden, Collaboration.hidden, ChatMessage.deletedForEveryone) instead of
// adding a parallel moderation schema to models that are off-limits this part
// (stories, communities, marketplace, chat). AIHistory has no hide concept — the only
// moderation action available on it is delete (removing an inappropriate logged output).
const HANDLERS = {
  story: {
    Model: Story,
    hide: (doc) => { doc.status = 'archived'; },
    restore: (doc) => { doc.status = 'published'; },
    getAuthor: (doc) => doc.author,
  },
  comment: {
    Model: Comment,
    hide: (doc) => { doc.deleted = true; doc.content = '[removed by moderator]'; },
    restore: (doc) => { doc.deleted = false; },
    getAuthor: (doc) => doc.author,
  },
  review: {
    Model: Review,
    hide: (doc) => { doc.hidden = true; },
    restore: (doc) => { doc.hidden = false; },
    getAuthor: (doc) => doc.author,
  },
  product: {
    Model: Product,
    hide: (doc) => { doc.status = 'hidden'; },
    restore: (doc) => { doc.status = 'active'; },
    getAuthor: (doc) => doc.seller,
  },
  community: {
    Model: Community,
    hide: (doc) => { doc.isActive = false; },
    restore: (doc) => { doc.isActive = true; },
    getAuthor: (doc) => doc.owner,
  },
  community_post: {
    Model: CommunityPost,
    hide: (doc) => { doc.hidden = true; },
    restore: (doc) => { doc.hidden = false; },
    getAuthor: (doc) => doc.author,
  },
  business: {
    Model: Business,
    hide: (doc) => { doc.isActive = false; },
    restore: (doc) => { doc.isActive = true; },
    getAuthor: (doc) => doc.owner,
  },
  event: {
    Model: Event,
    hide: (doc) => { doc.hidden = true; },
    restore: (doc) => { doc.hidden = false; },
    getAuthor: (doc) => doc.organizer,
  },
  collaboration: {
    Model: Collaboration,
    hide: (doc) => { doc.hidden = true; },
    restore: (doc) => { doc.hidden = false; },
    getAuthor: (doc) => doc.postedBy,
  },
  message: {
    Model: ChatMessage,
    hide: (doc) => { doc.deletedForEveryone = true; doc.text = ''; doc.attachments = []; },
    restore: () => { /* not reversible by design — matches "delete for everyone" semantics */ },
    getAuthor: (doc) => doc.sender,
  },
};

// @desc    Apply a moderation action to a piece of content
// @route   PATCH /api/admin/moderation/:targetType/:id
// @access  Private (admin, moderator)
const moderateContent = asyncHandler(async (req, res) => {
  const { targetType, id } = req.params;
  const { action, reason } = req.body; // action: 'hide' | 'restore' | 'delete'

  const handler = HANDLERS[targetType];
  if (!handler) {
    res.status(400);
    throw new Error(`Unsupported moderation target type: ${targetType}`);
  }

  const doc = await handler.Model.findById(id);
  if (!doc) {
    res.status(404);
    throw new Error('Content not found');
  }

  if (action === 'delete') {
    await doc.deleteOne();
  } else if (action === 'hide') {
    handler.hide(doc);
    await doc.save();
  } else if (action === 'restore') {
    handler.restore(doc);
    await doc.save();
  } else {
    res.status(400);
    throw new Error('action must be hide, restore, or delete');
  }

  const authorId = handler.getAuthor(doc);
  if (authorId && action !== 'restore') {
    await notify({
      recipient: authorId,
      actor: req.user._id,
      type: 'system_announcement',
      message: `Your ${targetType.replace('_', ' ')} was ${action === 'delete' ? 'removed' : 'hidden'} by a moderator${reason ? `: ${reason}` : '.'}`,
    });
  }

  await recordAudit({ adminId: req.user._id, action: `content.${action}`, targetType, targetId: id, details: { reason }, ip: req.ip });

  res.json({ success: true, message: `Content ${action}d` });
});

// @desc    Delete a logged AI interaction (the only moderation action available on AI content)
// @route   DELETE /api/admin/moderation/ai-history/:id
// @access  Private (admin)
const deleteAIHistoryEntry = asyncHandler(async (req, res) => {
  const entry = await AIHistory.findByIdAndDelete(req.params.id);
  if (!entry) {
    res.status(404);
    throw new Error('AI history entry not found');
  }
  await recordAudit({ adminId: req.user._id, action: 'content.delete', targetType: 'ai_history', targetId: req.params.id, ip: req.ip });
  res.json({ success: true, message: 'AI history entry deleted' });
});

// @desc    List recently reported/flagged content of a given type, for the moderation queue
// @route   GET /api/admin/moderation/flagged?type=
// @access  Private (admin, moderator)
const listFlaggedContent = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);

  const [products, reviews, communityPosts] = await Promise.all([
    Product.find({ reportsCount: { $gt: 0 } }).sort({ reportsCount: -1 }).limit(limit).select('name reportsCount status seller').populate('seller', 'name username'),
    Review.find({ reportsCount: { $gt: 0 } }).sort({ reportsCount: -1 }).limit(limit).select('description reportsCount hidden author').populate('author', 'name username'),
    CommunityPost.find({ reportsCount: { $gt: 0 } }).sort({ reportsCount: -1 }).limit(limit).select('content reportsCount hidden author').populate('author', 'name username'),
  ]);

  res.json({ success: true, data: { products, reviews, communityPosts } });
});

module.exports = { moderateContent, deleteAIHistoryEntry, listFlaggedContent };
