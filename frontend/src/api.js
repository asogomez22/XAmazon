import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const linksApi = {
  getAll: (status) => api.get('/links', { params: status ? { status } : {} }),
  create: (data) => api.post('/links', data),
  delete: (id) => api.delete(`/links/${id}`),
  retry: (id) => api.patch(`/links/${id}/retry`),
};

export const tweetsApi = {
  getAll: () => api.get('/tweets'),
  publishDraft: (id) => api.post(`/tweets/${id}/publish`),
};

export const botApi = {
  getStatus: () => api.get('/bot/status'),
  getConfig: () => api.get('/bot/config'),
  updateConfig: (data) => api.put('/bot/config', data),
  trigger: () => api.post('/bot/trigger'),
  verifyTwitter: () => api.post('/bot/verify-twitter'),
};
