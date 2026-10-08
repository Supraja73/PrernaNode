import api from './api';

export const fetchAIStatus = async () => (await api.get('/ai/status')).data.data;
export const fetchAIHistory = async (params = {}) => (await api.get('/ai/history', { params })).data;
export const runCareerFeature = async (feature, input = {}) => (await api.post(`/ai/career/${feature}`, input)).data.data;
export const runStoryFeature = async (feature, storyId) => (await api.post(`/ai/story/${feature}`, { storyId })).data.data;
export const fetchMentorMatches = async () => (await api.get('/ai/mentor-match')).data.data;
export const fetchBusinessRecommendations = async () => (await api.get('/ai/business-recommendations')).data.data;
