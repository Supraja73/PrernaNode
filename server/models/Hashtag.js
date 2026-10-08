const mongoose = require('mongoose');

const hashtagSchema = new mongoose.Schema(
  {
    tag: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    usageCount: { type: Number, default: 0 },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

hashtagSchema.index({ usageCount: -1 });

module.exports = mongoose.model('Hashtag', hashtagSchema);
