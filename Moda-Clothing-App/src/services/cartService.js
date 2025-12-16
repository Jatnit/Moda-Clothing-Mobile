import api from '../config/api';

const cartService = {
  // Lấy giỏ hàng
  getCart: async () => {
    const response = await api.get('/cart');
    return response;
  },

  // Lấy số lượng trong giỏ
  getCartCount: async () => {
    const response = await api.get('/cart/count');
    return response;
  },

  // Thêm sản phẩm vào giỏ
  addToCart: async (skuId, quantity = 1) => {
    const response = await api.post('/cart', { skuId, quantity });
    return response;
  },

  // Cập nhật số lượng
  updateQuantity: async (cartId, quantity) => {
    const response = await api.put(`/cart/${cartId}`, { quantity });
    return response;
  },

  // Xóa sản phẩm khỏi giỏ
  removeFromCart: async (cartId) => {
    const response = await api.delete(`/cart/${cartId}`);
    return response;
  },

  // Xóa toàn bộ giỏ hàng
  clearCart: async () => {
    const response = await api.delete('/cart');
    return response;
  },
};

export default cartService;
