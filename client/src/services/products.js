import api from './api';

export const fetchProductCategories = async () => (await api.get('/products/categories')).data.data;
export const listProducts = async (params = {}) => (await api.get('/products', { params })).data;
export const fetchProduct = async (id) => (await api.get(`/products/${id}`)).data.data;
export const fetchProductsBySeller = async (userId) => (await api.get(`/products/seller/${userId}`)).data.data;

export const createProduct = async (formData) =>
  (await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
export const updateProduct = async (id, formData) =>
  (await api.patch(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
export const toggleHideProduct = async (id) => (await api.patch(`/products/${id}/hide`)).data.data;
export const toggleSoldProduct = async (id) => (await api.patch(`/products/${id}/sold`)).data.data;
export const deleteProduct = async (id) => (await api.delete(`/products/${id}`)).data;
export const reportProduct = async (id) => (await api.post(`/products/${id}/report`)).data;
export const shareProduct = async (id) => (await api.post(`/products/${id}/share`)).data.data;

export const createInquiry = async (productId, message) =>
  (await api.post(`/products/${productId}/inquiries`, { message })).data.data;
