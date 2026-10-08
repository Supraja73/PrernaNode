import api from './api';

export const fetchCollaborationTypes = async () => (await api.get('/collaborations/types')).data.data;
export const listCollaborations = async (params = {}) => (await api.get('/collaborations', { params })).data;
export const fetchCollaboration = async (id) => (await api.get(`/collaborations/${id}`)).data.data;
export const createCollaboration = async (payload) => (await api.post('/collaborations', payload)).data.data;
export const applyToCollaboration = async (id, message) => (await api.post(`/collaborations/${id}/apply`, { message })).data;
export const respondToApplicant = async (id, userId, action) =>
  (await api.patch(`/collaborations/${id}/applicants/${userId}`, { action })).data.data;
export const closeCollaboration = async (id) => (await api.patch(`/collaborations/${id}/close`)).data.data;
