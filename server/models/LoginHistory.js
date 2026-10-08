const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // null if the email didn't match any account
    email: { type: String, trim: true, lowercase: true },
    success: { type: Boolean, required: true },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

loginHistorySchema.index({ user: 1, createdAt: -1 });
// TTL: raw login history older than 180 days ages out automatically.
loginHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
