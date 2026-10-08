const mongoose = require('mongoose');

// A singleton document (there is only ever one) holding platform-wide toggles.
// Read on every request that needs it via Settings.getSingleton(), cached briefly
// in-process to avoid a DB round trip per request.
const settingsSchema = new mongoose.Schema(
  {
    singleton: { type: Boolean, default: true, unique: true }, // always true — enforces exactly one document

    platformName: { type: String, default: 'PrernaNode' },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'PrernaNode is undergoing scheduled maintenance. Please check back soon.' },

    features: {
      communities: { type: Boolean, default: true },
      marketplace: { type: Boolean, default: true },
      mentorship: { type: Boolean, default: true },
      events: { type: Boolean, default: true },
      opportunities: { type: Boolean, default: true },
      collaborationHub: { type: Boolean, default: true },
      aiAssistant: { type: Boolean, default: true },
      chat: { type: Boolean, default: true },
    },

    registration: {
      requireEmailVerification: { type: Boolean, default: true },
      allowNewRegistrations: { type: Boolean, default: true },
    },

    security: {
      maxLoginAttemptsPerHour: { type: Number, default: 20 },
      sessionTimeoutDays: { type: Number, default: 30 },
    },

    email: {
      weeklyDigestEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

settingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne({ singleton: true });
  if (!settings) settings = await this.create({ singleton: true });
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
