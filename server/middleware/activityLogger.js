const LoginHistory = require('../models/LoginHistory');
const logger = require('../utils/logger');

// Wraps the /auth/login route: listens for the response to finish, then records a
// LoginHistory entry based on the final status code. This is the mechanism used
// specifically so authController.js itself never has to be touched — the logging
// happens entirely in routing/middleware, not in the auth logic.
const logLoginAttempt = (req, res, next) => {
  res.on('finish', () => {
    const success = res.statusCode < 400;
    LoginHistory.create({
      user: req.__loggedInUserId || null, // set by authController via res.locals if it chooses to; optional
      email: (req.body?.email || '').toLowerCase(),
      success,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || '',
    }).catch((err) => logger.error('Failed to write login history', { error: err.message }));

    if (!success) {
      logger.warn('Failed login attempt', { email: req.body?.email, ip: req.ip, status: res.statusCode });
    }
  });
  next();
};

// General-purpose request logger for the API log requirement — logs method, path,
// status, and duration for every request without needing to touch any route file
// beyond the one `app.use()` line in server.js.
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('API request', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - start,
      ip: req.ip,
    });
  });
  next();
};

module.exports = { logLoginAttempt, requestLogger };
