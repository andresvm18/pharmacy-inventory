import api from './api';

export const reportService = {
  getRevenue: async (startDate, endDate) => {
    const response = await api.get('/reports/revenue', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getExpiringProducts: async (daysThreshold = 30) => {
    const response = await api.get('/reports/expiring-products', {
      params: { daysThreshold },
    });
    return response.data;
  },

  getStockMovements: async (productId = null, batchId = null) => {
    const response = await api.get('/reports/stock-movements', {
      params: { productId, batchId },
    });
    return response.data;
  },
};