const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', default: null },

    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 6000 },
    banner: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },

    mode: { type: String, enum: ['Online', 'Offline', 'Hybrid'], default: 'Online' },
    venue: { type: String, trim: true, default: '' },
    onlineLink: { type: String, trim: true, default: '' },

    date: { type: Date, required: true },
    time: { type: String, trim: true, required: true },
    seats: { type: Number, default: 0 }, // 0 = unlimited

    speakers: [
      {
        name: { type: String, trim: true, required: true },
        title: { type: String, trim: true, default: '' },
        photoUrl: { type: String, default: '' },
      },
    ],
    schedule: [
      {
        time: { type: String, trim: true, required: true },
        activity: { type: String, trim: true, required: true },
      },
    ],
    gallery: [{ url: { type: String, required: true }, publicId: { type: String, required: true } }],

    rsvpGoing: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    rsvpInterested: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    feedback: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, trim: true, maxlength: 1000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    certificatesReady: { type: Boolean, default: false },
    status: { type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' },
    hidden: { type: Boolean, default: false }, // Part 5: set by admin moderation, independent of status
  },
  { timestamps: true }
);

eventSchema.index({ title: 'text', description: 'text' });
eventSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('Event', eventSchema);
