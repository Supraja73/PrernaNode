import api from './api';

export const listEvents = async (params = {}) => (await api.get('/events', { params })).data;
export const fetchEvent = async (id) => (await api.get(`/events/${id}`)).data.data;
export const createEvent = async (formData) =>
  (await api.post('/events', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
export const rsvpToEvent = async (id, status) => (await api.post(`/events/${id}/rsvp`, { status })).data.data;
export const leaveEventFeedback = async (id, rating, comment) =>
  (await api.post(`/events/${id}/feedback`, { rating, comment })).data;
