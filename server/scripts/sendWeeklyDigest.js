// A standalone, cron-ready job — NOT wired into any request path, so it never touches
// protected controllers. Run it on a schedule (e.g. a weekly cron job on your host, or
// `node scripts/sendWeeklyDigest.js` manually) once SMTP is configured.
//
// Usage: npm run digest:send
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Story = require('../models/Story');
const Opportunity = require('../models/Opportunity');
const Skill = require('../models/Skill');
const Settings = require('../models/Settings');
const sendEmail = require('../utils/sendEmail');
const emailTemplates = require('../utils/emailTemplates');
const logger = require('../utils/logger');

const run = async () => {
  await connectDB();

  const settings = await Settings.getSingleton();
  if (!settings.email.weeklyDigestEnabled) {
    logger.info('Weekly digest is disabled in Settings — skipping.');
    await mongoose.disconnect();
    return;
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [newStories, newOpportunities, newMentors, recipients] = await Promise.all([
    Story.countDocuments({ status: 'published', publishedAt: { $gte: since } }),
    Opportunity.countDocuments({ isActive: true, createdAt: { $gte: since } }),
    Skill.countDocuments({ isActive: true, createdAt: { $gte: since } }),
    User.find({ isVerified: true, isBanned: false }).select('name email'),
  ]);

  logger.info(`Sending weekly digest to ${recipients.length} users...`);

  let sent = 0;
  let failed = 0;
  for (const user of recipients) {
    try {
      const { subject, html } = emailTemplates.weeklyDigest(user.name, { newStories, newOpportunities, newMentors });
      await sendEmail({ to: user.email, subject, html });
      sent += 1;
    } catch (err) {
      failed += 1;
      logger.error('Failed to send digest', { email: user.email, error: err.message });
    }
  }

  logger.info(`Weekly digest complete: ${sent} sent, ${failed} failed.`);
  await mongoose.disconnect();
};

run().catch((err) => {
  logger.error('Weekly digest job crashed', { error: err.message });
  process.exit(1);
});
