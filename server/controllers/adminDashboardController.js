const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/User');
const Story = require('../models/Story');
const Community = require('../models/Community');
const Product = require('../models/Product');
const Skill = require('../models/Skill');
const MentorRequest = require('../models/MentorRequest');
const Business = require('../models/Business');
const Event = require('../models/Event');
const Opportunity = require('../models/Opportunity');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');

// @desc    High-level system overview — real counts, no placeholders
// @route   GET /api/admin/dashboard/overview
// @access  Private (admin)
const overview = asyncHandler(async (req, res) => {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers, dailyActiveUsers, newUsers30d, bannedUsers, suspendedUsers,
    totalStories, publishedStories,
    totalCommunities, totalProducts, activeProducts,
    totalMentorSkills, totalMentorRequests,
    totalBusinesses, totalEvents, upcomingEvents, totalOpportunities,
    pendingReports,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ lastLogin: { $gte: since24h } }),
    User.countDocuments({ createdAt: { $gte: since30d } }),
    User.countDocuments({ isBanned: true }),
    User.countDocuments({ isSuspended: true }),
    Story.countDocuments(),
    Story.countDocuments({ status: 'published' }),
    Community.countDocuments({ isActive: true }),
    Product.countDocuments(),
    Product.countDocuments({ status: 'active' }),
    Skill.countDocuments({ isActive: true }),
    MentorRequest.countDocuments(),
    Business.countDocuments({ isActive: true }),
    Event.countDocuments(),
    Event.countDocuments({ status: 'upcoming', date: { $gte: new Date() } }),
    Opportunity.countDocuments({ isActive: true }),
    Report.countDocuments({ status: 'pending' }),
  ]);

  res.json({
    success: true,
    data: {
      users: { total: totalUsers, dailyActive: dailyActiveUsers, newLast30Days: newUsers30d, banned: bannedUsers, suspended: suspendedUsers },
      stories: { total: totalStories, published: publishedStories },
      communities: { total: totalCommunities },
      marketplace: { totalProducts, activeProducts },
      mentorship: { totalSkillListings: totalMentorSkills, totalRequests: totalMentorRequests },
      businesses: { total: totalBusinesses },
      events: { total: totalEvents, upcoming: upcomingEvents },
      opportunities: { total: totalOpportunities },
      moderation: { pendingReports },
    },
  });
});

// @desc    Growth analytics — real monthly aggregation for users, stories, communities
// @route   GET /api/admin/dashboard/growth
// @access  Private (admin)
const growthAnalytics = asyncHandler(async (req, res) => {
  const monthlyGrowth = async (Model, dateField = 'createdAt') =>
    Model.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: `$${dateField}` } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]);

  const [userGrowth, storyGrowth, communityGrowth] = await Promise.all([
    monthlyGrowth(User),
    monthlyGrowth(Story, 'publishedAt'),
    monthlyGrowth(Community),
  ]);

  res.json({
    success: true,
    data: {
      userGrowth: userGrowth.map((g) => ({ month: g._id, count: g.count })),
      storyGrowth: storyGrowth.map((g) => ({ month: g._id, count: g.count })),
      communityGrowth: communityGrowth.map((g) => ({ month: g._id, count: g.count })),
    },
  });
});

// @desc    System health — DB connectivity, uptime, memory. A real, live check, not a
//          static "OK".
// @route   GET /api/admin/dashboard/health
// @access  Private (admin)
const systemHealth = asyncHandler(async (req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  const mem = process.memoryUsage();

  res.json({
    success: true,
    data: {
      database: { connected: dbState === 1, state: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown' },
      uptimeSeconds: Math.round(process.uptime()),
      memory: {
        rssMB: Math.round(mem.rss / 1024 / 1024),
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      },
      nodeVersion: process.version,
      env: process.env.NODE_ENV || 'development',
    },
  });
});

// @desc    Recent platform-wide activity feed for the admin dashboard
// @route   GET /api/admin/dashboard/recent-activity
// @access  Private (admin)
const recentActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);

  const [newUsers, newStories, newReports, recentAudits] = await Promise.all([
    User.find().sort({ createdAt: -1 }).limit(limit).select('name username createdAt'),
    Story.find({ status: 'published' }).sort({ publishedAt: -1 }).limit(limit).select('title author publishedAt').populate('author', 'name username'),
    Report.find().sort({ createdAt: -1 }).limit(limit).populate('reporter', 'name username'),
    AuditLog.find().sort({ createdAt: -1 }).limit(limit).populate('admin', 'name username'),
  ]);

  res.json({ success: true, data: { newUsers, newStories, newReports, recentAudits } });
});

module.exports = { overview, growthAnalytics, systemHealth, recentActivity };
