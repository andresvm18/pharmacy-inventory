import api from './api';

export const batchService = {
  getByProduct: async (productId) => {
    const response = await api.get(`/batches/product/${productId}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/batches', data);
    return response.data;
  },

  adjustStock: async (id, data) => {
    await api.patch(`/batches/${id}/adjust-stock`, data);
  },
};