const Chat = require('../models/Chat');
const ChatMessage = require('../models/ChatMessage');
const { emitToUser, emitToRoom, isOnline } = require('../socket/socketBus');
const { notify } = require('./notificationService');

const chatRoom = (chatId) => `chat:${chatId}`;

// Finds or creates the 1:1 chat between two users.
const getOrCreateDirectChat = async (userA, userB) => {
  let chat = await Chat.findOne({ isGroup: false, community: null, participants: { $all: [userA, userB], $size: 2 } });
  if (!chat) {
    chat = await Chat.create({ isGroup: false, participants: [userA, userB] });
  }
  return chat;
};

const getOrCreateCommunityChat = async (communityId, ownerId, name) => {
  let chat = await Chat.findOne({ community: communityId });
  if (!chat) {
    chat = await Chat.create({ isGroup: true, community: communityId, name, participants: [ownerId], admins: [ownerId] });
  }
  return chat;
};

// Persists a message, updates the chat's lastMessage preview, notifies offline
// participants, and emits to everyone currently in the room — the single code path
// used by both the Socket.io handler and the REST fallback (for clients without a
// live socket connection, e.g. a first request before the socket handshake completes).
const sendMessage = async ({ chatId, senderId, text, attachments = [], replyTo, forwardedFrom }) => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw Object.assign(new Error('Chat not found'), { statusCode: 404 });
  if (!chat.participants.some((p) => String(p) === String(senderId))) {
    throw Object.assign(new Error('You are not part of this chat'), { statusCode: 403 });
  }

  const message = await ChatMessage.create({
    chat: chat._id,
    sender: senderId,
    text,
    attachments,
    replyTo: replyTo || null,
    forwardedFrom: forwardedFrom || null,
    seenBy: [senderId],
  });

  chat.lastMessage = { text: text || (attachments.length ? '📎 Attachment' : ''), sender: senderId, sentAt: new Date() };
  await chat.save();

  const populated = await message.populate('sender', 'name username avatar');

  emitToRoom(chatRoom(chat._id), 'chat:message', populated);

  const others = chat.participants.filter((p) => String(p) !== String(senderId));
  await Promise.all(
    others.map(async (recipientId) => {
      emitToUser(recipientId, 'chat:notification', { chatId: chat._id, message: populated });
      if (!isOnline(recipientId)) {
        await notify({
          recipient: recipientId,
          actor: senderId,
          type: 'chat_message',
          message: `New message: ${text ? text.slice(0, 60) : 'sent an attachment'}`,
          refModel: 'Chat',
          refId: chat._id,
        });
      }
    })
  );

  return populated;
};

module.exports = { chatRoom, getOrCreateDirectChat, getOrCreateCommunityChat, sendMessage };
