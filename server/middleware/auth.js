const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Verifies the access token and attaches req.user
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401);
      throw new Error('Not authorized, user no longer exists');
    }
    if (user.isBanned) {
      res.status(403);
      throw new Error('This account has been suspended');
    }
    // Part 5 addition: temporary suspension enforcement, separate from the permanent ban above.
    if (user.isSuspended && (!user.suspendedUntil || user.suspendedUntil > new Date())) {
      res.status(403);
      throw new Error(
        user.suspendedUntil
          ? `Your account is suspended until ${user.suspendedUntil.toDateString()}. Reason: ${user.suspensionReason || 'Policy violation'}`
          : `Your account is suspended. Reason: ${user.suspensionReason || 'Policy violation'}`
      );
    }

    req.user = user;
    next();
  } catch (err) {
    if (res.statusCode !== 403) {
      res.status(401);
    }
    if (err.name === 'TokenExpiredError') {
      throw new Error('Access token expired');
    }
    throw err;
  }
});

// Restricts a route to specific roles, e.g. authorize('admin', 'moderator')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error('You do not have permission to perform this action');
    }
    next();
  };
};

// Attaches req.user if a valid access token is present, but never blocks the request
// if it's missing or invalid. Used by public routes (feed, story detail, search) that
// want to know the viewer when possible without requiring login.
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);
    if (user && !user.isBanned) {
      req.user = user;
    }
  } catch (err) {
    // Invalid/expired token on an optional route just means "treat as logged out".
  }
  next();
});

module.exports = { protect, authorize, optionalAuth };
