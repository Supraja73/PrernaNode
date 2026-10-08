import api from './api';

export const fetchCollections = async () => (await api.get('/collections')).data.data;
export const createCollection = async (name) => (await api.post('/collections', { name })).data.data;
export const renameCollection = async (id, name) => (await api.patch(`/collections/${id}`, { name })).data.data;
export const deleteCollection = async (id) => (await api.delete(`/collections/${id}`)).data;
export const fetchCollectionItems = async (id) => (await api.get(`/collections/${id}`)).data.data;
export const saveItem = async (resourceType, resourceId, collectionId) =>
  (await api.post('/collections/save', { resourceType, resourceId, collectionId })).data.data;
export const removeItem = async (collectionId, resourceType, resourceId) =>
  (await api.delete(`/collections/${collectionId}/items`, { data: { resourceType, resourceId } })).data.data;
