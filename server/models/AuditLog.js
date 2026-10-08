const mongoose = require('mongoose');

// Every admin action (ban, suspend, moderate content, change settings...) is recorded
// here — a required piece for any real admin panel, both for accountability and for
// undoing mistakes.
const auditLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, trim: true }, // e.g. 'user.suspend', 'content.hide', 'settings.update'
    targetType: { type: String, trim: true, default: '' },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String, default: '' },
  },
  { timestamps: true }
);

auditLogSchema.index({ admin: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
