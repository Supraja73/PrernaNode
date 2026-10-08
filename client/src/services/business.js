import api from './api';

export const fetchBusinessCategories = async () => (await api.get('/businesses/categories')).data.data;
export const listBusinesses = async (params = {}) => (await api.get('/businesses', { params })).data;
export const fetchBusiness = async (id) => (await api.get(`/businesses/${id}`)).data.data;
export const fetchBusinessesByOwner = async (userId) => (await api.get(`/businesses/owner/${userId}`)).data.data;

export const createBusiness = async (formData) =>
  (await api.post('/businesses', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
export const updateBusiness = async (id, formData) =>
  (await api.patch(`/businesses/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
export const deleteBusiness = async (id) => (await api.delete(`/businesses/${id}`)).data;

export const followBusiness = async (id) => (await api.post(`/businesses/${id}/follow`)).data.data;
export const unfollowBusiness = async (id) => (await api.delete(`/businesses/${id}/follow`)).data.data;
