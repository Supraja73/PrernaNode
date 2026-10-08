const mongoose = require('mongoose');

const REPORT_TARGET_TYPES = [
  'story', 'comment', 'community', 'community_post', 'product', 'business',
  'message', 'event', 'profile', 'review', 'collaboration',
];

// The formal, admin-reviewable report record. Several models (Story, Product,
// Community, CommunityPost, Review) already have a lightweight `reportsCount`
// counter for at-a-glance signal — this collection is the actual moderation queue
// with a reason, description, and reviewable history, and is what the Admin Panel
// works from. The two aren't merged: the counters stay as fast, cheap signals; this
// is the audit trail.
const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: REPORT_TARGET_TYPES, required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },

    reason: {
      type: String,
      required: true,
      enum: ['spam', 'harassment', 'hate_speech', 'misinformation', 'inappropriate_content', 'impersonation', 'scam', 'other'],
    },
    description: { type: String, trim: true, maxlength: 1000, default: '' },

    status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'dismissed'], default: 'pending', index: true },
    actionTaken: { type: String, enum: ['none', 'hidden', 'deleted', 'warned', 'suspended', 'banned'], default: 'none' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    adminNote: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true }
);

reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ status: 1, createdAt: -1 });

reportSchema.statics.TARGET_TYPES = REPORT_TARGET_TYPES;

module.exports = mongoose.model('Report', reportSchema);
module.exports.TARGET_TYPES = REPORT_TARGET_TYPES;
