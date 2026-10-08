const mongoose = require('mongoose');

const COLLAB_TYPES = [
  'Need Developer', 'Need Designer', 'Looking for Co-Founder', 'Need AI Engineer',
  'Research Collaboration', 'Startup Collaboration', 'Hackathon Team', 'Other',
];

const collaborationSchema = new mongoose.Schema(
  {
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    type: { type: String, required: true, enum: COLLAB_TYPES },
    rolesNeeded: [{ type: String, trim: true, maxlength: 80 }],
    skillsNeeded: [{ type: String, trim: true, lowercase: true }],

    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
    hidden: { type: Boolean, default: false }, // Part 5: set by admin moderation

    applicants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, trim: true, maxlength: 1000, default: '' },
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
        appliedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

collaborationSchema.index({ title: 'text', description: 'text' });
collaborationSchema.index({ status: 1, createdAt: -1 });

collaborationSchema.statics.TYPES = COLLAB_TYPES;

module.exports = mongoose.model('Collaboration', collaborationSchema);
module.exports.TYPES = COLLAB_TYPES;
