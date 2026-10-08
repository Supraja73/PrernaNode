import api from './api';

export const createReport = async (targetType, targetId, reason, description) =>
  (await api.post('/reports', { targetType, targetId, reason, description })).data;
export const fetchMyReports = async () => (await api.get('/reports/mine')).data.data;
