import api from './api';

export const reportService = {
  getRevenue: async (startDate, endDate) => {
    const response = await api.get('/reports/revenue', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getRevenueByDay: async (startDate, endDate) => {
    const response = await api.get('/reports/revenue-by-day', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getTopProducts: async (startDate, endDate, limit = 5) => {
    const response = await api.get('/reports/top-products', {
      params: { startDate, endDate, limit },
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