const mongoose = require('mongoose');
const crypto = require('crypto');

// Tracks each issued refresh token as a "device session" so users can see
// where they're logged in and revoke access remotely (à la GitHub/Google).
const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, select: false },
    userAgent: { type: String, default: 'Unknown device' },
    ip: { type: String, default: '' },
    rememberMe: { type: Boolean, default: false },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Mongo TTL auto-cleanup

sessionSchema.statics.hashToken = (rawToken) =>
  crypto.createHash('sha256').update(rawToken).digest('hex');

module.exports = mongoose.model('Session', sessionSchema);
