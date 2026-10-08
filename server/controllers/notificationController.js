const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// @desc    List the logged-in user's notifications (paginated)
// @route   GET /api/notifications
// @access  Private
const listNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor', 'name username avatar')
      .populate('story', 'title images'),
    Notification.countDocuments({ recipient: req.user._id }),
  ]);

  res.json({
    success: true,
    data: notifications,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Unread notification count (for the navbar badge)
// @route   GET /api/notifications/unread-count
// @access  Private
const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, read: false });
  res.json({ success: true, data: { count } });
});

// @desc    Mark one notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  res.json({ success: true, data: notification });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = { listNotifications, unreadCount, markRead, markAllRead };
