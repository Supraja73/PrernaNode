const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    story: { type: mongoose.Schema.Types.ObjectId, ref: 'Story', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },

    content: { type: String, required: true, trim: true, maxlength: 2000 },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    likesCount: { type: Number, default: 0 },
    repliesCount: { type: Number, default: 0 },

    edited: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false }, // soft delete so reply threads don't break
  },
  { timestamps: true }
);

commentSchema.index({ story: 1, parent: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);
