import api from './api';

export const fetchChats = async () => (await api.get('/chats')).data.data;
export const startDirectChat = async (userId) => (await api.post(`/chats/direct/${userId}`)).data.data;
export const createGroupChat = async (name, participantIds) =>
  (await api.post('/chats/group', { name, participantIds })).data.data;
export const fetchMessages = async (chatId, params = {}) => (await api.get(`/chats/${chatId}/messages`, { params })).data;
export const postMessage = async (chatId, formData) =>
  (await api.post(`/chats/${chatId}/messages`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
export const searchMessages = async (chatId, q) => (await api.get(`/chats/${chatId}/messages/search`, { params: { q } })).data.data;
export const togglePinMessage = async (id) => (await api.patch(`/chats/messages/${id}/pin`)).data.data;
export const toggleStarMessage = async (id) => (await api.patch(`/chats/messages/${id}/star`)).data.data;
export const fetchPinnedMessages = async (chatId) => (await api.get(`/chats/${chatId}/messages/pinned`)).data.data;
export const fetchStarredMessages = async (chatId) => (await api.get(`/chats/${chatId}/messages/starred`)).data.data;
