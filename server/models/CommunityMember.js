const mongoose = require('mongoose');

const communityMemberSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['owner', 'moderator', 'member'], default: 'member' },
    status: { type: String, enum: ['pending', 'active'], default: 'active', index: true }, // pending = join request awaiting approval (private/invite-only)
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

communityMemberSchema.index({ community: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('CommunityMember', communityMemberSchema);
