// A tiny indirection layer so REST controllers/services can emit real-time events
// without importing the Socket.io server directly (avoids circular requires and lets
// everything degrade gracefully to "no socket connected yet" during tests/scripts).
let ioInstance = null;
const onlineUsers = new Map(); // userId (string) -> Set of socket ids

const setIO = (io) => {
  ioInstance = io;
};

const getIO = () => ioInstance;

const markOnline = (userId, socketId) => {
  const key = String(userId);
  if (!onlineUsers.has(key)) onlineUsers.set(key, new Set());
  onlineUsers.get(key).add(socketId);
};

const markOffline = (userId, socketId) => {
  const key = String(userId);
  const set = onlineUsers.get(key);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) onlineUsers.delete(key);
};

const isOnline = (userId) => onlineUsers.has(String(userId));
const getOnlineUserIds = () => Array.from(onlineUsers.keys());

// Emits an event to every socket a given user currently has open (multi-tab/device safe).
const emitToUser = (userId, event, payload) => {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
};

const emitToRoom = (room, event, payload) => {
  if (!ioInstance) return;
  ioInstance.to(room).emit(event, payload);
};

module.exports = { setIO, getIO, markOnline, markOffline, isOnline, getOnlineUserIds, emitToUser, emitToRoom };
