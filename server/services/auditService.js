const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

// Records an admin action for accountability. Never throws — an audit-log failure
// must not block the actual admin action from completing.
const recordAudit = async ({ adminId, action, targetType, targetId, details, ip }) => {
  try {
    await AuditLog.create({ admin: adminId, action, targetType, targetId, details, ip });
  } catch (err) {
    logger.error('Failed to write audit log', { action, error: err.message });
  }
};

module.exports = { recordAudit };
