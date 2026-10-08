const mongoose = require('mongoose');

// Generic like so both stories and comments share one collection/index pattern.
const likeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['story', 'comment', 'community_post', 'community_comment'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

likeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });
likeSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('Like', likeSchema);
