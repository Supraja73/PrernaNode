const mongoose = require('mongoose');

// Covers one-to-one, group, and community chat in a single collection — a community
// chat is just a Chat with `community` set and `isGroup: true`, avoiding a separate
// CommunityMessage collection/duplicate chat system.
const chatSchema = new mongoose.Schema(
  {
    isGroup: { type: Boolean, default: false },
    name: { type: String, trim: true, maxlength: 100, default: '' }, // group/community chat display name
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // group chat admins
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', default: null, index: true },

    lastMessage: {
      text: { type: String, default: '' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      sentAt: { type: Date },
    },
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 });
chatSchema.index({ community: 1 }, { unique: true, partialFilterExpression: { community: { $type: 'objectId' } } });

module.exports = mongoose.model('Chat', chatSchema);
