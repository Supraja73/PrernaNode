import api from './api';

export const fetchFeed = async ({ sort = 'newest', page = 1, limit = 10, category } = {}) => {
  const { data } = await api.get('/stories/feed', { params: { sort, page, limit, category } });
  return data;
};

export const fetchStory = async (id) => (await api.get(`/stories/${id}`)).data.data;

export const fetchUserStories = async (userId, params = {}) =>
  (await api.get(`/stories/user/${userId}`, { params })).data;

export const fetchSavedStories = async (params = {}) => (await api.get('/stories/saved', { params })).data;

export const searchStories = async (q, params = {}) =>
  (await api.get('/stories/search', { params: { q, ...params } })).data;

export const fetchCategories = async () => (await api.get('/stories/categories')).data.data;

export const createStory = async (formData) =>
  (await api.post('/stories', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;

export const updateStory = async (id, formData) =>
  (await api.patch(`/stories/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;

export const archiveStory = async (id) => (await api.patch(`/stories/${id}/archive`)).data;
export const togglePinStory = async (id) => (await api.patch(`/stories/${id}/pin`)).data.data;
export const deleteStory = async (id) => (await api.delete(`/stories/${id}`)).data;

export const likeStory = async (id) => (await api.post(`/stories/${id}/like`)).data.data;
export const unlikeStory = async (id) => (await api.delete(`/stories/${id}/like`)).data.data;
export const fetchStoryLikers = async (id, params = {}) => (await api.get(`/stories/${id}/likes`, { params })).data;

export const saveStory = async (id) => (await api.post(`/stories/${id}/save`)).data.data;
export const unsaveStory = async (id) => (await api.delete(`/stories/${id}/save`)).data.data;

export const shareStory = async (id) => (await api.post(`/stories/${id}/share`)).data.data;

export const fetchComments = async (storyId, params = {}) =>
  (await api.get(`/stories/${storyId}/comments`, { params })).data;

export const fetchReplies = async (commentId, params = {}) =>
  (await api.get(`/comments/${commentId}/replies`, { params })).data;

export const addComment = async (storyId, content, parent) =>
  (await api.post(`/stories/${storyId}/comments`, { content, parent })).data.data;

export const editComment = async (id, content) => (await api.patch(`/comments/${id}`, { content })).data.data;
export const deleteComment = async (id) => (await api.delete(`/comments/${id}`)).data;
export const likeComment = async (id) => (await api.post(`/comments/${id}/like`)).data.data;
export const unlikeComment = async (id) => (await api.delete(`/comments/${id}/like`)).data.data;
