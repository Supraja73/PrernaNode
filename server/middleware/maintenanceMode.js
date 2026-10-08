const Settings = require('../models/Settings');

let cache = { value: false, message: '', expiresAt: 0 };

// Checked on every request; cached in-process for 30s so maintenance mode doesn't add
// a DB round trip per request. Admin routes and auth routes stay reachable so an admin
// can always log in and turn maintenance mode back off.
const maintenanceMode = async (req, res, next) => {
  const exempt = req.path.startsWith('/api/admin') || req.path.startsWith('/api/auth') || req.path === '/api/health';
  if (exempt) return next();

  try {
    if (Date.now() > cache.expiresAt) {
      const settings = await Settings.getSingleton();
      cache = { value: settings.maintenanceMode, message: settings.maintenanceMessage, expiresAt: Date.now() + 30000 };
    }
  } catch (err) {
    return next(); // if Settings can't be read, fail open rather than taking the whole API down
  }

  if (cache.value) {
    return res.status(503).json({ success: false, message: cache.message, maintenanceMode: true });
  }
  next();
};

module.exports = maintenanceMode;
