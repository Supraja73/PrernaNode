const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'follow',
  'like_story',
  'like_comment',
  'comment',
  'reply',
  'share',
  'save',
  'mention',
  'publish',
  // Part 3 additions
  'mentor_request',
  'mentor_request_accepted',
  'mentor_request_rejected',
  'mentor_request_rescheduled',
  'mentor_request_completed',
  'mentor_request_cancelled',
  'business_follow',
  'product_inquiry',
  'inquiry_reply',
  'inquiry_accepted',
  'inquiry_rejected',
  'product_sold',
  'new_review',
  // Part 4 additions
  'chat_message',
  'community_invite',
  'community_join_request',
  'community_join_accepted',
  'community_join_rejected',
  'community_post',
  'event_reminder',
  'event_rsvp',
  'collaboration_application',
  'collaboration_accepted',
  'collaboration_rejected',
  'system_announcement',
];

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },

    story: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    // Part 3: generic reference so one schema can point at a mentor request, product,
    // business, inquiry, or review without adding a ref field for every new type.
    refModel: { type: String, enum: ['MentorRequest', 'Product', 'Business', 'Inquiry', 'Review', 'Community', 'CommunityPost', 'Chat', 'Event', 'Collaboration'] },
    refId: { type: mongoose.Schema.Types.ObjectId },

    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.TYPES = NOTIFICATION_TYPES;
