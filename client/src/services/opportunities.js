import api from './api';

export const fetchOpportunityTypes = async () => (await api.get('/opportunities/types')).data.data;
export const listOpportunities = async (params = {}) => (await api.get('/opportunities', { params })).data;
export const fetchOpportunity = async (id) => (await api.get(`/opportunities/${id}`)).data.data;
export const createOpportunity = async (payload) => (await api.post('/opportunities', payload)).data.data;
export const shareOpportunity = async (id) => (await api.post(`/opportunities/${id}/share`)).data.data;
export const bookmarkOpportunity = async (id) => (await api.post(`/opportunities/${id}/bookmark`)).data.data;
export const unbookmarkOpportunity = async (id) => (await api.delete(`/opportunities/${id}/bookmark`)).data.data;
