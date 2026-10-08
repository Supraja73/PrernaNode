import api from './api';

export const fetchUserByUsername = async (username) => (await api.get(`/users/u/${username}`)).data.data;

export const followUser = async (userId) => (await api.post(`/follow/${userId}`)).data;
export const unfollowUser = async (userId) => (await api.delete(`/follow/${userId}`)).data;
export const fetchFollowers = async (userId, params = {}) =>
  (await api.get(`/follow/${userId}/followers`, { params })).data;
export const fetchFollowing = async (userId, params = {}) =>
  (await api.get(`/follow/${userId}/following`, { params })).data;
export const fetchMutualFollowers = async (userId) => (await api.get(`/follow/${userId}/mutual`)).data.data;
export const fetchSuggestedUsers = async (limit = 10) =>
  (await api.get('/follow/suggestions', { params: { limit } })).data.data;
export const fetchNewMembers = async (limit = 10) =>
  (await api.get('/follow/new-members', { params: { limit } })).data.data;

export const fetchPopularCreators = async (limit = 10) =>
  (await api.get('/discovery/popular-creators', { params: { limit } })).data.data;
export const fetchTrendingMentors = async (limit = 10) =>
  (await api.get('/discovery/trending-mentors', { params: { limit } })).data.data;

export const fetchTrendingHashtags = async (limit = 15) =>
  (await api.get('/hashtags/trending', { params: { limit } })).data.data;
export const fetchHashtagPage = async (tag, params = {}) => (await api.get(`/hashtags/${tag}`, { params })).data;

export const globalSearch = async (q, type = 'all') => (await api.get('/search', { params: { q, type } })).data.data;

export const fetchNotifications = async (params = {}) => (await api.get('/notifications', { params })).data;
export const fetchUnreadCount = async () => (await api.get('/notifications/unread-count')).data.data.count;
export const markNotificationRead = async (id) => (await api.patch(`/notifications/${id}/read`)).data;
export const markAllNotificationsRead = async () => (await api.patch('/notifications/read-all')).data;
