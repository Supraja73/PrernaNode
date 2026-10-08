import api from './api';

export const fetchOverview = async () => (await api.get('/admin/dashboard/overview')).data.data;
export const fetchGrowth = async () => (await api.get('/admin/dashboard/growth')).data.data;
export const fetchSystemHealth = async () => (await api.get('/admin/dashboard/health')).data.data;
export const fetchRecentActivity = async () => (await api.get('/admin/dashboard/recent-activity')).data.data;

export const fetchAdminUsers = async (params = {}) => (await api.get('/admin/users', { params })).data;
export const fetchAdminUserDetail = async (id) => (await api.get(`/admin/users/${id}`)).data.data;
export const suspendUser = async (id, reason, until) => (await api.patch(`/admin/users/${id}/suspend`, { reason, until })).data;
export const reactivateUser = async (id) => (await api.patch(`/admin/users/${id}/reactivate`)).data;
export const banUser = async (id, reason) => (await api.patch(`/admin/users/${id}/ban`, { reason })).data;
export const unbanUser = async (id) => (await api.patch(`/admin/users/${id}/unban`)).data;
export const removeUser = async (id) => (await api.delete(`/admin/users/${id}`)).data;
export const warnUser = async (id, reason) => (await api.post(`/admin/users/${id}/warn`, { reason })).data;
export const assignModerator = async (id) => (await api.patch(`/admin/users/${id}/assign-moderator`)).data;
export const removeModerator = async (id) => (await api.patch(`/admin/users/${id}/remove-moderator`)).data;

export const fetchVerificationRequests = async () => (await api.get('/admin/verification-requests')).data.data;
export const reviewVerificationRequest = async (id, action, note) =>
  (await api.patch(`/admin/verification-requests/${id}`, { action, note })).data;

export const moderateContent = async (targetType, id, action, reason) =>
  (await api.patch(`/admin/moderation/${targetType}/${id}`, { action, reason })).data;
export const fetchFlaggedContent = async () => (await api.get('/admin/moderation/flagged')).data.data;
export const deleteAIHistoryEntry = async (id) => (await api.delete(`/admin/moderation/ai-history/${id}`)).data;

export const fetchReports = async (params = {}) => (await api.get('/admin/reports', { params })).data;
export const fetchReport = async (id) => (await api.get(`/admin/reports/${id}`)).data.data;
export const resolveReport = async (id, payload) => (await api.patch(`/admin/reports/${id}`, payload)).data.data;

export const fetchTopPerformers = async () => (await api.get('/admin/analytics/top')).data.data;
export const fetchMostActiveUsers = async () => (await api.get('/admin/analytics/active-users')).data.data;
export const fetchEngagementRate = async () => (await api.get('/admin/analytics/engagement')).data.data;
export const fetchDailyActivity = async () => (await api.get('/admin/analytics/daily-activity')).data.data;

export const fetchSettings = async () => (await api.get('/admin/settings')).data.data;
export const updateSettings = async (payload) => (await api.patch('/admin/settings', payload)).data.data;
