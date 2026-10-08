const mongoose = require('mongoose');

// Generic bookmark so any resource type (story, mentor, product, review, job...)
// can be saved without needing a separate collection per type.
const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resourceType: {
      type: String,
      required: true,
      enum: ['user', 'story', 'product', 'mentor', 'review', 'community', 'opportunity', 'collaboration', 'event'],
    },
    resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

bookmarkSchema.index({ user: 1, resourceType: 1, resourceId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
