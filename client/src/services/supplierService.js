import api from './api';

export const supplierService = {
  getAll: async () => {
    const response = await api.get('/suppliers');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/suppliers', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
  },

  remove: async (id) => {
    await api.delete(`/suppliers/${id}`);
  },
};