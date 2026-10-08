const mongoose = require('mongoose');

const SKILL_CATEGORIES = [
  'Technology', 'Business', 'Design', 'Marketing', 'Finance', 'Writing',
  'Languages', 'Arts & Crafts', 'Health & Wellness', 'Career Coaching',
  'Academics', 'Personal Development',
];

const skillSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    skillName: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, required: true, enum: SKILL_CATEGORIES },
    experienceLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], required: true },
    yearsOfExperience: { type: Number, min: 0, max: 60, required: true },
    languagesSpoken: [{ type: String, trim: true }],

    teachingMode: { type: String, enum: ['Online', 'Offline', 'Hybrid'], required: true },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
    timezone: { type: String, trim: true, default: '' },

    // Simple weekly availability: array of { day, slots: ['09:00-10:00', ...] }
    availability: [
      {
        day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], required: true },
        slots: [{ type: String, trim: true }],
      },
    ],
    sessionDurationMinutes: { type: Number, default: 30, min: 15, max: 240 },
    priceLabel: { type: String, enum: ['Free', 'Paid'], default: 'Free' }, // display only, per spec — no payments

    bio: { type: String, trim: true, maxlength: 2000, default: '' },
    portfolio: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    resume: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    certificates: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    demoImages: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    demoVideo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    socialLinks: {
      github: { type: String, trim: true, default: '' },
      linkedin: { type: String, trim: true, default: '' },
      portfolioWebsite: { type: String, trim: true, default: '' },
    },
    achievements: [{ type: String, trim: true, maxlength: 200 }],

    totalStudents: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0 },
    profileViews: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

skillSchema.index({ skillName: 'text', bio: 'text' });
skillSchema.index({ category: 1, isActive: 1 });
skillSchema.index({ averageRating: -1 });
skillSchema.index({ city: 1, country: 1 });
skillSchema.index({ mentor: 1 });

skillSchema.statics.CATEGORIES = SKILL_CATEGORIES;

module.exports = mongoose.model('Skill', skillSchema);
module.exports.CATEGORIES = SKILL_CATEGORIES;
