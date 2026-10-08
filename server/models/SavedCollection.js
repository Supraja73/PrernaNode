const mongoose = require('mongoose');

const savedItemSchema = new mongoose.Schema(
  {
    resourceType: { type: String, enum: ['mentor', 'business', 'product'], required: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const savedCollectionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    items: [savedItemSchema],
  },
  { timestamps: true }
);

savedCollectionSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('SavedCollection', savedCollectionSchema);
