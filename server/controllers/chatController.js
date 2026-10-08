const asyncHandler = require('express-async-handler');
const Chat = require('../models/Chat');
const ChatMessage = require('../models/ChatMessage');
const { getOrCreateDirectChat, sendMessage } = require('../services/chatService');
const { isOnline } = require('../socket/socketBus');

const paginate = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 30, 60);
  return { page, limit, skip: (page - 1) * limit };
};

// @desc    List the logged-in user's chats, sorted by most recent activity
// @route   GET /api/chats
// @access  Private
const listChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ participants: req.user._id })
    .sort({ 'lastMessage.sentAt': -1, updatedAt: -1 })
    .populate('participants', 'name username avatar')
    .populate('community', 'name logo');

  const withPresence = await Promise.all(
    chats.map(async (chat) => {
      const unreadCount = await ChatMessage.countDocuments({
        chat: chat._id,
        seenBy: { $ne: req.user._id },
        deletedForEveryone: false,
        sender: { $ne: req.user._id },
      });
      const obj = chat.toObject();
      obj.unreadCount = unreadCount;
      if (!chat.isGroup) {
        const other = chat.participants.find((p) => String(p._id) !== String(req.user._id));
        obj.isOtherOnline = other ? isOnline(other._id) : false;
      }
      return obj;
    })
  );

  res.json({ success: true, data: withPresence });
});

// @desc    Start (or fetch) a direct chat with another user
// @route   POST /api/chats/direct/:userId
// @access  Private
const startDirectChat = asyncHandler(async (req, res) => {
  if (String(req.params.userId) === String(req.user._id)) {
    res.status(400);
    throw new Error('You cannot message yourself');
  }
  const chat = await getOrCreateDirectChat(req.user._id, req.params.userId);
  const populated = await chat.populate('participants', 'name username avatar');
  res.json({ success: true, data: populated });
});

// @desc    Create a group chat
// @route   POST /api/chats/group
// @access  Private
const createGroupChat = asyncHandler(async (req, res) => {
  const { name, participantIds } = req.body;
  const participants = [...new Set([req.user._id.toString(), ...(participantIds || [])])];
  if (participants.length < 3) {
    res.status(400);
    throw new Error('A group chat needs at least 3 participants');
  }
  const chat = await Chat.create({ isGroup: true, name, participants, admins: [req.user._id] });
  const populated = await chat.populate('participants', 'name username avatar');
  res.status(201).json({ success: true, data: populated });
});

// @desc    Get message history for a chat (paginated, newest first)
// @route   GET /api/chats/:id/messages
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }
  if (!chat.participants.some((p) => String(p) === String(req.user._id))) {
    res.status(403);
    throw new Error('You are not part of this chat');
  }

  const { page, limit, skip } = paginate(req);
  const [messages, total] = await Promise.all([
    ChatMessage.find({ chat: chat._id, deletedFor: { $ne: req.user._id } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name username avatar')
      .populate('replyTo'),
    ChatMessage.countDocuments({ chat: chat._id, deletedFor: { $ne: req.user._id } }),
  ]);

  res.json({ success: true, data: messages.reverse(), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// @desc    Send a message via REST (fallback for clients without a live socket yet)
// @route   POST /api/chats/:id/messages
// @access  Private
const postMessage = asyncHandler(async (req, res) => {
  const attachments = [
    ...(req.files?.images || []).map((f) => ({ type: 'image', url: f.path, publicId: f.filename, fileName: f.originalname })),
    ...(req.files?.document || []).map((f) => ({ type: 'document', url: f.path, publicId: f.filename, fileName: f.originalname })),
    ...(req.files?.voice || []).map((f) => ({ type: 'voice', url: f.path, publicId: f.filename, fileName: f.originalname })),
  ];

  const message = await sendMessage({
    chatId: req.params.id,
    senderId: req.user._id,
    text: req.body.text || '',
    attachments,
    replyTo: req.body.replyTo,
    forwardedFrom: req.body.forwardedFrom,
  });

  res.status(201).json({ success: true, data: message });
});

// @desc    Search messages within a chat
// @route   GET /api/chats/:id/messages/search?q=
// @access  Private
const searchMessages = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat || !chat.participants.some((p) => String(p) === String(req.user._id))) {
    res.status(403);
    throw new Error('You are not part of this chat');
  }
  const messages = await ChatMessage.find({ chat: chat._id, $text: { $search: req.query.q || '' }, deletedForEveryone: false })
    .limit(30)
    .populate('sender', 'name username avatar');
  res.json({ success: true, data: messages });
});

// @desc    Pin / star a message
// @route   PATCH /api/chats/messages/:id/pin
// @access  Private
const togglePinMessage = asyncHandler(async (req, res) => {
  const message = await ChatMessage.findById(req.params.id);
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }
  message.pinned = !message.pinned;
  await message.save();
  res.json({ success: true, data: { pinned: message.pinned } });
});

const toggleStarMessage = asyncHandler(async (req, res) => {
  const message = await ChatMessage.findById(req.params.id);
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }
  const already = message.starredBy.some((u) => String(u) === String(req.user._id));
  if (already) message.starredBy = message.starredBy.filter((u) => String(u) !== String(req.user._id));
  else message.starredBy.push(req.user._id);
  await message.save();
  res.json({ success: true, data: { starred: !already } });
});

const listPinned = asyncHandler(async (req, res) => {
  const messages = await ChatMessage.find({ chat: req.params.id, pinned: true }).populate('sender', 'name username avatar');
  res.json({ success: true, data: messages });
});

const listStarred = asyncHandler(async (req, res) => {
  const messages = await ChatMessage.find({ chat: req.params.id, starredBy: req.user._id }).populate('sender', 'name username avatar');
  res.json({ success: true, data: messages });
});

module.exports = {
  listChats, startDirectChat, createGroupChat, getMessages, postMessage, searchMessages,
  togglePinMessage, toggleStarMessage, listPinned, listStarred,
};
