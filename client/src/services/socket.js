import { io } from 'socket.io-client';
import { getAccessToken } from './api';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

let socket = null;

// Lazily creates a single shared socket connection, authenticated with the current
// in-memory access token (same one Axios uses — see services/api.js). Call this after
// login; call disconnectSocket() on logout so a stale token isn't reused.
export const getSocket = () => {
  if (socket) return socket;
  socket = io(SOCKET_URL, {
    autoConnect: false,
    auth: { token: getAccessToken() },
  });
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  s.auth = { token: getAccessToken() };
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect();
};
