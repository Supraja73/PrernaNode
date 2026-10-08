const mongoose = require('mongoose');

const OPPORTUNITY_TYPES = [
  'Job', 'Internship', 'Scholarship', 'Hackathon', 'Competition', 'Conference',
  'Workshop', 'Webinar', 'Grant', 'Fellowship', 'Accelerator Program', 'Incubator',
  'Women Entrepreneurship Program', 'Government Scheme',
];

const opportunitySchema = new mongoose.Schema(
  {
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 6000 },
    eligibility: { type: String, trim: true, maxlength: 2000, default: '' },
    type: { type: String, required: true, enum: OPPORTUNITY_TYPES },
    organization: { type: String, required: true, trim: true, maxlength: 160 },

    deadline: { type: Date },
    location: { type: String, trim: true, default: '' },
    mode: { type: String, enum: ['Remote', 'Hybrid', 'Offline'], default: 'Remote' },
    applyLink: { type: String, required: true, trim: true },

    bookmarksCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

opportunitySchema.index({ title: 'text', description: 'text', organization: 'text' });
opportunitySchema.index({ type: 1, isActive: 1, deadline: 1 });
opportunitySchema.index({ deadline: 1 });

opportunitySchema.statics.TYPES = OPPORTUNITY_TYPES;

module.exports = mongoose.model('Opportunity', opportunitySchema);
module.exports.TYPES = OPPORTUNITY_TYPES;
