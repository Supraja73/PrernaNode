const mongoose = require('mongoose');

const mentorRequestSchema = new mongoose.Schema(
  {
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true, index: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, required: true, trim: true }, // e.g. "14:30"
    message: { type: String, trim: true, maxlength: 1000, default: '' },
    resume: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'rescheduled', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    suggestedDate: { type: Date },
    suggestedTime: { type: String, trim: true },
    responseNote: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

mentorRequestSchema.index({ mentor: 1, status: 1, preferredDate: -1 });
mentorRequestSchema.index({ student: 1, status: 1, preferredDate: -1 });

module.exports = mongoose.model('MentorRequest', mentorRequestSchema);
