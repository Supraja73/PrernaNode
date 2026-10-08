import api from './api';

export const fetchSkillCategories = async () => (await api.get('/skills/categories')).data.data;

export const discoverSkills = async (params = {}) => (await api.get('/skills', { params })).data;

export const fetchSkill = async (id) => (await api.get(`/skills/${id}`)).data.data;

export const fetchMentorSkills = async (userId) => (await api.get(`/skills/mentor/${userId}`)).data.data;

export const createSkill = async (formData) =>
  (await api.post('/skills', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;

export const updateSkill = async (id, formData) =>
  (await api.patch(`/skills/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;

export const deleteSkill = async (id) => (await api.delete(`/skills/${id}`)).data;
