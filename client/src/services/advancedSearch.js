import api from './api';

export const advancedSearch = async (q, type = 'all') => (await api.get('/advanced-search', { params: { q, type } })).data.data;
