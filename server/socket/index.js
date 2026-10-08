const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');
const ChatMessage = require('../models/ChatMessage');
const { setIO, markOnline, markOffline, getOnlineUserIds, emitToRoom } = require('./socketBus');
const { chatRoom, sendMessage } = require('../services/chatService');

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Auth handshake — same JWT access token used by the REST API, passed as
  // `auth: { token }` from the client. Never trusts an unauthenticated socket.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id);
      if (!user || user.isBanned) return next(new Error('Not authorized'));
      socket.userId = String(user._id);
      socket.userName = user.name;
      next();
    } catch (err) {
      next(new Error('Not authorized'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    socket.join(`user:${userId}`); // personal room, used for cross-device notification delivery
    markOnline(userId, socket.id);
    io.emit('presence:online', { userId, online: true });

    // Auto-join every chat room this user is already a participant of, so messages
    // land without the client having to explicitly join each one on load.
    try {
      const chats = await Chat.find({ participants: userId }).select('_id');
      chats.forEach((c) => socket.join(chatRoom(c._id)));
    } catch (err) {
      // non-fatal — client can still join rooms explicitly via chat:join
    }

    socket.on('chat:join', (chatId) => {
      socket.join(chatRoom(chatId));
    });

    socket.on('chat:leave', (chatId) => {
      socket.leave(chatRoom(chatId));
    });

    socket.on('chat:message', async (payload, ack) => {
      try {
        const message = await sendMessage({
          chatId: payload.chatId,
          senderId: userId,
          text: payload.text || '',
          attachments: payload.attachments || [],
          replyTo: payload.replyTo,
          forwardedFrom: payload.forwardedFrom,
        });
        if (typeof ack === 'function') ack({ success: true, data: message });
      } catch (err) {
        if (typeof ack === 'function') ack({ success: false, message: err.message });
      }
    });

    socket.on('chat:typing', ({ chatId, isTyping }) => {
      socket.to(chatRoom(chatId)).emit('chat:typing', { chatId, userId, isTyping: !!isTyping });
    });

    socket.on('chat:seen', async ({ chatId }) => {
      try {
        await ChatMessage.updateMany(
          { chat: chatId, seenBy: { $ne: userId } },
          { $addToSet: { seenBy: userId } }
        );
        emitToRoom(chatRoom(chatId), 'chat:seen', { chatId, userId, seenAt: new Date() });
      } catch (err) {
        // non-fatal
      }
    });

    socket.on('chat:delete', async ({ messageId, forEveryone }) => {
      try {
        const message = await ChatMessage.findById(messageId);
        if (!message) return;
        if (forEveryone) {
          if (String(message.sender) !== userId) return; // only the sender can delete for everyone
          message.deletedForEveryone = true;
          message.text = '';
          message.attachments = [];
        } else {
          message.deletedFor.push(userId);
        }
        await message.save();
        emitToRoom(chatRoom(message.chat), 'chat:message-deleted', { messageId, forEveryone: !!forEveryone, userId });
      } catch (err) {
        // non-fatal
      }
    });

    socket.on('disconnect', () => {
      markOffline(userId, socket.id);
      // Only announce fully offline once no sockets remain for this user (multi-tab safe).
      if (!getOnlineUserIds().includes(userId)) {
        io.emit('presence:online', { userId, online: false });
      }
    });
  });

  setIO(io);
  return io;
};

module.exports = { initSocket };
