import api from '../config/api';

export const orderService = {
  // Lấy danh sách đơn hàng của user
  getOrders: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response;
  },

  // Lấy chi tiết đơn hàng
  getOrderDetail: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response;
  },

  // Tạo đơn hàng mới
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response;
  },

  // Hủy đơn hàng
  cancelOrder: async (orderId) => {
    const response = await api.put(`/orders/${orderId}/cancel`);
    return response;
  },
};

export default orderService;
