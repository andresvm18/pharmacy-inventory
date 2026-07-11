import api from './api';

export const supplierService = {
  getAll: async () => {
    const response = await api.get('/suppliers');
    return response.data;
  },
};