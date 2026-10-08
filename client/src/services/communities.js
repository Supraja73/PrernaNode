import api from './api';

export const fetchCommunityCategories = async () => (await api.get('/communities/categories')).data.data;
export const listCommunities = async (params = {}) => (await api.get('/communities', { params })).data;
export const fetchCommunity = async (id) => (await api.get(`/communities/${id}`)).data.data;

export const createCommunity = async (formData) =>
  (await api.post('/communities', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
export const updateCommunity = async (id, formData) =>
  (await api.patch(`/communities/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
export const deleteCommunity = async (id) => (await api.delete(`/communities/${id}`)).data;

export const joinCommunity = async (id) => (await api.post(`/communities/${id}/join`)).data.data;
export const leaveCommunity = async (id) => (await api.delete(`/communities/${id}/join`)).data;
export const listJoinRequests = async (id) => (await api.get(`/communities/${id}/requests`)).data.data;
export const respondToJoinRequest = async (id, userId, action) =>
  (await api.patch(`/communities/${id}/requests/${userId}`, { action })).data;
export const listCommunityMembers = async (id, params = {}) => (await api.get(`/communities/${id}/members`, { params })).data;
export const setModerator = async (id, userId, makeModerator) =>
  (await api.patch(`/communities/${id}/members/${userId}/role`, { makeModerator })).data.data;
export const reportCommunity = async (id) => (await api.post(`/communities/${id}/report`)).data;
export const fetchCommunityAnalytics = async (id) => (await api.get(`/communities/${id}/analytics`)).data.data;
export const fetchCommunityChatId = async (id) => (await api.get(`/communities/${id}/chat`)).data.data.chatId;

export const fetchCommunityPosts = async (communityId, params = {}) =>
  (await api.get(`/community-posts/${communityId}`, { params })).data;
export const createCommunityPost = async (communityId, formData) =>
  (await api.post(`/community-posts/${communityId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
export const deleteCommunityPost = async (id) => (await api.delete(`/community-posts/post/${id}`)).data;
export const togglePinPost = async (id) => (await api.patch(`/community-posts/post/${id}/pin`)).data.data;
export const voteOnPoll = async (id, optionIndex) => (await api.post(`/community-posts/post/${id}/vote`, { optionIndex })).data.data;
export const likeCommunityPost = async (id) => (await api.post(`/community-posts/post/${id}/like`)).data.data;
export const unlikeCommunityPost = async (id) => (await api.delete(`/community-posts/post/${id}/like`)).data.data;
export const fetchPostComments = async (id, params = {}) => (await api.get(`/community-posts/post/${id}/comments`, { params })).data;
export const addPostComment = async (id, content, replyTo) =>
  (await api.post(`/community-posts/post/${id}/comments`, { content, replyTo })).data.data;
export const reportCommunityPost = async (id) => (await api.post(`/community-posts/post/${id}/report`)).data;
export const shareCommunityPost = async (id) => (await api.post(`/community-posts/post/${id}/share`)).data.data;
