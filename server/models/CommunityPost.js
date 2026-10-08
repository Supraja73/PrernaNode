const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    type: { type: String, enum: ['post', 'poll', 'question', 'discussion', 'resource'], default: 'post' },
    content: { type: String, required: true, trim: true, maxlength: 8000 },

    images: [{ url: { type: String, required: true }, publicId: { type: String, required: true } }],
    video: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },

    // Poll support (type: 'poll')
    poll: {
      question: { type: String, trim: true, maxlength: 300 },
      options: [
        {
          text: { type: String, trim: true, maxlength: 150 },
          votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        },
      ],
      closesAt: { type: Date },
    },

    pinned: { type: Boolean, default: false },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    reportsCount: { type: Number, default: 0 },
    hidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

communityPostSchema.index({ community: 1, pinned: -1, createdAt: -1 });
communityPostSchema.index({ content: 'text' });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
