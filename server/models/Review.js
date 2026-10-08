const mongoose = require('mongoose');

// Polymorphic review — covers mentors (via Skill), businesses, and products/services in
// one collection. "Services" from the spec are represented as Skill or Product reviews
// depending on what's being reviewed; there's no separate Service model in this app.
const reviewSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['skill', 'business', 'product'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 120, default: '' },
    description: { type: String, trim: true, maxlength: 3000, required: true },
    pros: [{ type: String, trim: true, maxlength: 200 }],
    cons: [{ type: String, trim: true, maxlength: 200 }],
    images: [{ url: { type: String, required: true }, publicId: { type: String, required: true } }],

    anonymous: { type: Boolean, default: false },
    helpfulVotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reportsCount: { type: Number, default: 0 },
    hidden: { type: Boolean, default: false }, // soft-hide if reported/moderated
  },
  { timestamps: true }
);

reviewSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
reviewSchema.index({ author: 1, targetType: 1, targetId: 1 }, { unique: true }); // one review per user per target

reviewSchema.methods.toPublicObject = function (viewerId) {
  const obj = this.toObject();
  obj.helpfulCount = obj.helpfulVotes?.length || 0;
  obj.helpfulByViewer = viewerId ? obj.helpfulVotes?.some((v) => String(v) === String(viewerId)) : false;
  delete obj.helpfulVotes;
  if (obj.anonymous && String(obj.author?._id || obj.author) !== String(viewerId)) {
    obj.author = { name: 'Anonymous', anonymous: true };
  }
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Review', reviewSchema);
