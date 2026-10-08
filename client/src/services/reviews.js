import api from './api';

export const fetchReviews = async (targetType, targetId, params = {}) =>
  (await api.get('/reviews', { params: { targetType, targetId, ...params } })).data;
export const fetchMyReviews = async (params = {}) => (await api.get('/reviews/mine', { params })).data;

export const createReview = async (formData) =>
  (await api.post('/reviews', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
export const updateReview = async (id, payload) => (await api.patch(`/reviews/${id}`, payload)).data.data;
export const deleteReview = async (id) => (await api.delete(`/reviews/${id}`)).data;
export const toggleReviewHelpful = async (id) => (await api.post(`/reviews/${id}/helpful`)).data.data;
export const reportReview = async (id) => (await api.post(`/reviews/${id}/report`)).data;
