const mongoose = require('mongoose');

const BUSINESS_CATEGORIES = [
  'Technology', 'Healthcare', 'Education', 'Fashion', 'Food', 'Finance',
  'Agriculture', 'Consulting', 'Beauty', 'Manufacturing', 'Arts', 'NGOs',
];

const businessSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    businessName: { type: String, required: true, trim: true, maxlength: 120 },
    founderName: { type: String, trim: true, maxlength: 80, default: '' },
    description: { type: String, trim: true, maxlength: 3000, default: '' },
    category: { type: String, required: true, enum: BUSINESS_CATEGORIES },

    logo: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
    coverBanner: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
    gallery: [{ url: { type: String, required: true }, publicId: { type: String, required: true } }],

    website: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },

    socialLinks: {
      instagram: { type: String, trim: true, default: '' },
      facebook: { type: String, trim: true, default: '' },
      twitter: { type: String, trim: true, default: '' },
      linkedin: { type: String, trim: true, default: '' },
    },

    // Simple embedded follow list — a business "page follow" is one-directional and
    // doesn't need the mutuals/suggestions machinery the Part 2 user Follow collection has.
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0 },
    profileViews: { type: Number, default: 0 },

    isVerified: { type: Boolean, default: false }, // "verification ready" — flag exists, no verification workflow yet
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

businessSchema.index({ businessName: 'text', description: 'text' });
businessSchema.index({ category: 1, isActive: 1 });
businessSchema.index({ city: 1, country: 1 });
businessSchema.index({ owner: 1 });

businessSchema.methods.toPublicObject = function (viewerId) {
  const obj = this.toObject();
  obj.followersCount = obj.followers?.length || 0;
  obj.isFollowing = viewerId ? obj.followers?.some((f) => String(f) === String(viewerId)) : false;
  delete obj.followers;
  delete obj.__v;
  return obj;
};

businessSchema.statics.CATEGORIES = BUSINESS_CATEGORIES;

module.exports = mongoose.model('Business', businessSchema);
module.exports.CATEGORIES = BUSINESS_CATEGORIES;
