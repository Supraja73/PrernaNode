import api from './api';

export const fetchMentorDashboard = async () => (await api.get('/dashboard/mentor')).data.data;
export const fetchMentorAnalytics = async () => (await api.get('/dashboard/mentor/analytics')).data.data;
export const fetchBusinessDashboard = async () => (await api.get('/dashboard/business')).data.data;
export const fetchBusinessAnalytics = async () => (await api.get('/dashboard/business/analytics')).data.data;
export const fetchMarketplaceDashboard = async () => (await api.get('/dashboard/marketplace')).data.data;
