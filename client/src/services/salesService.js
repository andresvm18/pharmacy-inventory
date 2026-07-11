import api from './api';

export const salesService = {
  create: async (items) => {
    const response = await api.post('/sales', { items });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  getByDateRange: async (startDate, endDate) => {
    const response = await api.get('/sales/date-range', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getByUser: async (userId) => {
    const response = await api.get(`/sales/user/${userId}`);
    return response.data;
  },
};