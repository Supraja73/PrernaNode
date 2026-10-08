import api from './api';

export const fetchMentorRequests = async (params = {}) => (await api.get('/mentor-requests', { params })).data;
export const fetchMentorRequest = async (id) => (await api.get(`/mentor-requests/${id}`)).data.data;

export const createMentorRequest = async (formData) =>
  (await api.post('/mentor-requests', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;

export const acceptMentorRequest = async (id, responseNote) =>
  (await api.patch(`/mentor-requests/${id}/accept`, { responseNote })).data.data;
export const rejectMentorRequest = async (id, responseNote) =>
  (await api.patch(`/mentor-requests/${id}/reject`, { responseNote })).data.data;
export const suggestNewTime = async (id, suggestedDate, suggestedTime, responseNote) =>
  (await api.patch(`/mentor-requests/${id}/suggest-time`, { suggestedDate, suggestedTime, responseNote })).data.data;
export const completeMentorRequest = async (id) => (await api.patch(`/mentor-requests/${id}/complete`)).data.data;
export const cancelMentorRequest = async (id) => (await api.patch(`/mentor-requests/${id}/cancel`)).data.data;
