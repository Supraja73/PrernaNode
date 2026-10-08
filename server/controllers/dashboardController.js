const asyncHandler = require('express-async-handler');
const Skill = require('../models/Skill');
const MentorRequest = require('../models/MentorRequest');
const Review = require('../models/Review');
const Business = require('../models/Business');
const Product = require('../models/Product');
const Inquiry = require('../models/Inquiry');
const Notification = require('../models/Notification');

// @desc    Mentor dashboard — real counts across all of the user's skill listings
// @route   GET /api/dashboard/mentor
// @access  Private
const mentorDashboard = asyncHandler(async (req, res) => {
  const skills = await Skill.find({ mentor: req.user._id });
  const skillIds = skills.map((s) => s._id);

  const [requestCounts, recentRequests, recentReviews] = await Promise.all([
    MentorRequest.aggregate([
      { $match: { mentor: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    MentorRequest.find({ mentor: req.user._id }).sort({ createdAt: -1 }).limit(5).populate('student', 'name username avatar').populate('skill', 'skillName'),
    Review.find({ targetType: 'skill', targetId: { $in: skillIds }, hidden: false }).sort({ createdAt: -1 }).limit(5).populate('author', 'name username avatar'),
  ]);

  const statusMap = Object.fromEntries(requestCounts.map((r) => [r._id, r.count]));

  res.json({
    success: true,
    data: {
      totalSkillListings: skills.length,
      totalProfileViews: skills.reduce((sum, s) => sum + s.profileViews, 0),
      totalStudents: skills.reduce((sum, s) => sum + s.totalStudents, 0),
      averageRating: skills.length ? Math.round((skills.reduce((s, sk) => s + sk.averageRating, 0) / skills.length) * 10) / 10 : 0,
      requestsByStatus: {
        pending: statusMap.pending || 0,
        accepted: statusMap.accepted || 0,
        rescheduled: statusMap.rescheduled || 0,
        completed: statusMap.completed || 0,
        cancelled: statusMap.cancelled || 0,
        rejected: statusMap.rejected || 0,
      },
      recentRequests,
      recentReviews: recentReviews.map((r) => r.toPublicObject(req.user._id)),
      skills,
    },
  });
});

// @desc    Mentor analytics — trend-friendly series, all from real documents
// @route   GET /api/dashboard/mentor/analytics
// @access  Private
const mentorAnalytics = asyncHandler(async (req, res) => {
  const skills = await Skill.find({ mentor: req.user._id }).select('_id profileViews totalStudents averageRating skillName');

  const requestTrend = await MentorRequest.aggregate([
    { $match: { mentor: req.user._id } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 12 },
  ]);

  const ratingTrend = await Review.find({ targetType: 'skill', targetId: { $in: skills.map((s) => s._id) }, hidden: false })
    .sort({ createdAt: 1 })
    .select('rating createdAt')
    .limit(50);

  res.json({
    success: true,
    data: {
      profileViewsBySkill: skills.map((s) => ({ skillName: s.skillName, profileViews: s.profileViews })),
      requestsPerMonth: requestTrend.map((r) => ({ month: r._id, count: r.count })),
      ratingTrend: ratingTrend.map((r) => ({ rating: r.rating, date: r.createdAt })),
    },
  });
});

// @desc    Business / entrepreneur dashboard — combined, since one Business model backs both
// @route   GET /api/dashboard/business
// @access  Private
const businessDashboard = asyncHandler(async (req, res) => {
  const businesses = await Business.find({ owner: req.user._id });
  const businessIds = businesses.map((b) => b._id);

  const products = await Product.find({ seller: req.user._id });
  const productIds = products.map((p) => p._id);

  const [inquiryCounts, recentInquiries, recentReviews] = await Promise.all([
    Inquiry.aggregate([
      { $match: { seller: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Inquiry.find({ seller: req.user._id }).sort({ updatedAt: -1 }).limit(5).populate('buyer', 'name username avatar').populate('product', 'name images'),
    Review.find({ targetType: { $in: ['business', 'product'] }, targetId: { $in: [...businessIds, ...productIds] }, hidden: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'name username avatar'),
  ]);

  const statusMap = Object.fromEntries(inquiryCounts.map((r) => [r._id, r.count]));

  res.json({
    success: true,
    data: {
      businesses: businesses.map((b) => b.toPublicObject(req.user._id)),
      totalFollowers: businesses.reduce((sum, b) => sum + b.followers.length, 0),
      totalProfileViews: businesses.reduce((sum, b) => sum + b.profileViews, 0),
      totalProducts: products.length,
      totalProductViews: products.reduce((sum, p) => sum + p.viewCount, 0),
      inquiriesByStatus: {
        open: statusMap.open || 0,
        accepted: statusMap.accepted || 0,
        reserved: statusMap.reserved || 0,
        rejected: statusMap.rejected || 0,
        cancelled: statusMap.cancelled || 0,
      },
      recentInquiries,
      recentReviews: recentReviews.map((r) => r.toPublicObject(req.user._id)),
    },
  });
});

// @desc    Marketplace-only dashboard (a seller who has no business page yet, just listings)
// @route   GET /api/dashboard/marketplace
// @access  Private
const marketplaceDashboard = asyncHandler(async (req, res) => {
  const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });
  const totalInquiries = await Inquiry.countDocuments({ seller: req.user._id });

  res.json({
    success: true,
    data: {
      totalListings: products.length,
      activeListings: products.filter((p) => p.status === 'active').length,
      soldListings: products.filter((p) => p.status === 'sold').length,
      totalViews: products.reduce((sum, p) => sum + p.viewCount, 0),
      totalSaves: products.reduce((sum, p) => sum + p.savesCount, 0),
      totalInquiries,
      topPerforming: [...products].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5),
    },
  });
});

// @desc    Business analytics
// @route   GET /api/dashboard/business/analytics
// @access  Private
const businessAnalytics = asyncHandler(async (req, res) => {
  const businesses = await Business.find({ owner: req.user._id }).select('_id businessName profileViews followers');
  const products = await Product.find({ seller: req.user._id }).select('_id name viewCount savesCount reportsCount averageRating');

  const inquiryTrend = await Inquiry.aggregate([
    { $match: { seller: req.user._id } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $limit: 12 },
  ]);

  res.json({
    success: true,
    data: {
      businessFollowerCounts: businesses.map((b) => ({ businessName: b.businessName, followers: b.followers.length, profileViews: b.profileViews })),
      listingPerformance: products.map((p) => ({ name: p.name, views: p.viewCount, saves: p.savesCount, rating: p.averageRating })),
      inquiriesPerMonth: inquiryTrend.map((i) => ({ month: i._id, count: i.count })),
    },
  });
});

// @desc    Notifications-aware summary for any dashboard's header widget
// @route   GET /api/dashboard/summary
// @access  Private
const dashboardSummary = asyncHandler(async (req, res) => {
  const unread = await Notification.countDocuments({ recipient: req.user._id, read: false });
  res.json({ success: true, data: { unreadNotifications: unread } });
});

module.exports = {
  mentorDashboard,
  mentorAnalytics,
  businessDashboard,
  marketplaceDashboard,
  businessAnalytics,
  dashboardSummary,
};
