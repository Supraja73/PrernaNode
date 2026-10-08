const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['image', 'document', 'voice'], required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    fileName: { type: String, default: '' },
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    text: { type: String, trim: true, maxlength: 4000, default: '' },
    attachments: [attachmentSchema],

    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage', default: null },
    forwardedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage', default: null },

    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // "delete for me"
    deletedForEveryone: { type: Boolean, default: false },

    pinned: { type: Boolean, default: false },
    starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

chatMessageSchema.index({ chat: 1, createdAt: -1 });
chatMessageSchema.index({ text: 'text' });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
