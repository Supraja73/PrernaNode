const mongoose = require('mongoose');

// A flat (non-nested) comment model for community posts — kept intentionally simpler
// than Part 2's story Comment model (which supports nested replies), since community
// discussions read fine as a flat list and this avoids over-engineering a second
// nested-reply system for what the spec lists as "Comment / Reply" at one level.
const communityPostCommentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPostComment', default: null },
    likesCount: { type: Number, default: 0 },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

communityPostCommentSchema.index({ post: 1, createdAt: 1 });

module.exports = mongoose.model('CommunityPostComment', communityPostCommentSchema);
