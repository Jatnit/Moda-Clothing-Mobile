import api from '../config/api';

const wishlistService = {
  // Lấy danh sách yêu thích
  getWishlist: async () => {
    const response = await api.get('/wishlist');
    return response;
  },

  // Thêm sản phẩm vào yêu thích
  addToWishlist: async (productId) => {
    const response = await api.post(`/wishlist/${productId}`);
    return response;
  },

  // Xóa sản phẩm khỏi yêu thích
  removeFromWishlist: async (productId) => {
    const response = await api.delete(`/wishlist/${productId}`);
    return response;
  },

  // Kiểm tra sản phẩm có trong yêu thích không
  checkInWishlist: async (productId) => {
    const response = await api.get(`/wishlist/check/${productId}`);
    return response;
  },

  // Toggle yêu thích
  toggleWishlist: async (productId) => {
    const response = await api.post(`/wishlist/toggle/${productId}`);
    return response;
  },
};

export default wishlistService;
