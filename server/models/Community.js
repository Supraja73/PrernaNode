const mongoose = require('mongoose');

const COMMUNITY_CATEGORIES = [
  'Women in AI', 'Women in Web Development', 'Women Entrepreneurs', 'Women in Cybersecurity',
  'Women in Medicine', 'Women in Finance', 'Women in UPSC', 'Women in Startups',
  'Career Growth', 'Creative Arts', 'Health & Wellness', 'Student Circles',
];

const communitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    rules: [{ type: String, trim: true, maxlength: 300 }],
    category: { type: String, required: true, enum: COMMUNITY_CATEGORIES },
    tags: [{ type: String, trim: true, lowercase: true }],

    banner: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
    logo: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },

    visibility: { type: String, enum: ['public', 'private', 'invite-only'], default: 'public' },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    memberCount: { type: Number, default: 1 },
    pinnedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost' }],

    reportsCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

communitySchema.index({ name: 'text', description: 'text', tags: 'text' });
communitySchema.index({ category: 1, isActive: 1 });
communitySchema.index({ visibility: 1 });

communitySchema.statics.CATEGORIES = COMMUNITY_CATEGORIES;

module.exports = mongoose.model('Community', communitySchema);
module.exports.CATEGORIES = COMMUNITY_CATEGORIES;
