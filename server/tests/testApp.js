// Builds a minimal Express app for testing — mounts the real route modules against
// the real controllers/models, without pulling in server.js's side effects (DB connect
// on import, http.createServer + Socket.io init, process.listen). This keeps the tests
// fast and isolated while still exercising the actual production code paths.
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const adminRoutes = require('../routes/adminRoutes');

const buildTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);

  // Minimal error handler mirroring server.js's real one, so 4xx/5xx bodies match.
  app.use((err, req, res, next) => {
    const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    res.status(status).json({ success: false, message: err.message });
  });

  return app;
};

module.exports = buildTestApp;
