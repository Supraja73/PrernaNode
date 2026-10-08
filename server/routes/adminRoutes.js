const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const {
  overview, growthAnalytics, systemHealth, recentActivity,
} = require('../controllers/adminDashboardController');
const {
  listUsers, getUserDetail, suspendUser, reactivateUser, banUser, unbanUser, removeUser, warnUser,
  assignModerator, removeModerator, listVerificationRequests, reviewVerificationRequest,
} = require('../controllers/adminUserController');
const { moderateContent, deleteAIHistoryEntry, listFlaggedContent } = require('../controllers/adminModerationController');
const { listReports, getReport, resolveReport, reportHistory } = require('../controllers/adminReportController');
const { topPerformers, mostActiveUsers, engagementRate, dailyActivity } = require('../controllers/adminAnalyticsController');
const { getSettings, updateSettings } = require('../controllers/adminSettingsController');

const router = express.Router();

// Every admin route requires a logged-in user; most require the admin role outright.
// A few moderation-queue read/action routes also allow 'moderator', matching the
// role already defined on User since Part 1.
router.use(protect);

router.get('/dashboard/overview', authorize('admin'), overview);
router.get('/dashboard/growth', authorize('admin'), growthAnalytics);
router.get('/dashboard/health', authorize('admin'), systemHealth);
router.get('/dashboard/recent-activity', authorize('admin'), recentActivity);

router.get('/users', authorize('admin', 'moderator'), listUsers);
router.get('/users/:id', authorize('admin', 'moderator'), getUserDetail);
router.patch('/users/:id/suspend', authorize('admin', 'moderator'), suspendUser);
router.patch('/users/:id/reactivate', authorize('admin', 'moderator'), reactivateUser);
router.patch('/users/:id/ban', authorize('admin'), banUser);
router.patch('/users/:id/unban', authorize('admin'), unbanUser);
router.delete('/users/:id', authorize('admin'), removeUser);
router.post('/users/:id/warn', authorize('admin', 'moderator'), warnUser);
router.patch('/users/:id/assign-moderator', authorize('admin'), assignModerator);
router.patch('/users/:id/remove-moderator', authorize('admin'), removeModerator);

router.get('/verification-requests', authorize('admin', 'moderator'), listVerificationRequests);
router.patch('/verification-requests/:id', authorize('admin', 'moderator'), reviewVerificationRequest);

router.patch('/moderation/:targetType/:id', authorize('admin', 'moderator'), moderateContent);
router.delete('/moderation/ai-history/:id', authorize('admin'), deleteAIHistoryEntry);
router.get('/moderation/flagged', authorize('admin', 'moderator'), listFlaggedContent);

router.get('/reports', authorize('admin', 'moderator'), listReports);
router.get('/reports/:id', authorize('admin', 'moderator'), getReport);
router.patch('/reports/:id', authorize('admin', 'moderator'), resolveReport);
router.get('/reports/history/:targetType/:targetId', authorize('admin', 'moderator'), reportHistory);

router.get('/analytics/top', authorize('admin'), topPerformers);
router.get('/analytics/active-users', authorize('admin'), mostActiveUsers);
router.get('/analytics/engagement', authorize('admin'), engagementRate);
router.get('/analytics/daily-activity', authorize('admin'), dailyActivity);

router.get('/settings', authorize('admin'), getSettings);
router.patch('/settings', authorize('admin'), updateSettings);

module.exports = router;
