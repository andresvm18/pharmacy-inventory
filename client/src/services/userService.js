import api from './api';

export const userService = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  resetPassword: async (id, newPassword) => {
    await api.patch(`/users/${id}/reset-password`, { newPassword });
  },

  toggleActive: async (id) => {
    await api.patch(`/users/${id}/toggle-active`);
  },
};