// A standalone startup/CI health check — validates required environment variables and
// that MongoDB is reachable, before the app is considered ready to serve traffic.
// Usage: npm run health-check (run manually, or as a pre-deploy / container healthcheck step)
require('dotenv').config();
const mongoose = require('mongoose');

const REQUIRED_VARS = [
  'MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'CLIENT_URL',
];
const RECOMMENDED_VARS = [
  'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET', 'ANTHROPIC_API_KEY',
];

const run = async () => {
  console.log('--- PrernaNode health check ---');

  const missingRequired = REQUIRED_VARS.filter((v) => !process.env[v]);
  const missingRecommended = RECOMMENDED_VARS.filter((v) => !process.env[v]);

  if (missingRequired.length) {
    console.error(`❌ Missing required environment variables: ${missingRequired.join(', ')}`);
    process.exit(1);
  }
  console.log('✅ Required environment variables present');

  if (missingRecommended.length) {
    console.warn(`⚠️  Missing recommended environment variables (some features will be disabled): ${missingRecommended.join(', ')}`);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB connection successful');
    await mongoose.disconnect();
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }

  console.log('--- Health check passed ---');
  process.exit(0);
};

run();
