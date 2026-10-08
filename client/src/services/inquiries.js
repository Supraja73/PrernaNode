import api from './api';

export const fetchInquiries = async (params = {}) => (await api.get('/inquiries', { params })).data;
export const fetchInquiry = async (id) => (await api.get(`/inquiries/${id}`)).data.data;
export const replyToInquiry = async (id, text) => (await api.post(`/inquiries/${id}/reply`, { text })).data.data;
export const acceptInquiry = async (id) => (await api.patch(`/inquiries/${id}/accept`)).data.data;
export const rejectInquiry = async (id) => (await api.patch(`/inquiries/${id}/reject`)).data.data;
export const reserveInquiry = async (id) => (await api.patch(`/inquiries/${id}/reserve`)).data.data;
export const cancelInquiry = async (id) => (await api.patch(`/inquiries/${id}/cancel`)).data.data;
