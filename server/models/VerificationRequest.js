const mongoose = require('mongoose');

// A "verified badge" request (distinct from Part 1's email verification) — a mentor
// or business owner asking the platform to confirm their identity/credentials.
const verificationRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String, trim: true, maxlength: 1000, required: true },
    documentUrl: { type: String, default: '' },
    documentPublicId: { type: String, default: '' },

    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNote: { type: String, trim: true, maxlength: 500, default: '' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

verificationRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);
