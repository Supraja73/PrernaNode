import api from './api';

export const requestVerification = async (formData) =>
  (await api.post('/verification-requests', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
export const fetchMyVerificationStatus = async () => (await api.get('/verification-requests/mine')).data.data;
