const Notification = require('../models/Notification');
const { emitToUser } = require('../socket/socketBus');

/**
 * Creates a notification, silently skipping self-notifications
 * (e.g. liking your own story shouldn't notify you), and pushes it live over
 * Socket.io to any of the recipient's open connections (Part 4 addition — falls
 * back gracefully to "notification just sits unread" if no socket is connected).
 */
const notify = async ({ recipient, actor, type, message, story, comment, refModel, refId }) => {
  if (String(recipient) === String(actor)) return null;
  try {
    const notification = await Notification.create({ recipient, actor, type, message, story, comment, refModel, refId });
    const populated = await notification.populate('actor', 'name username avatar');
    emitToUser(recipient, 'notification:new', populated);
    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

module.exports = { notify };
