import api from '../config/api';

const reviewService = {
  // Lấy reviews của sản phẩm
  getProductReviews: async (productId, page = 1, limit = 10) => {
    const response = await api.get(`/reviews/product/${productId}?page=${page}&limit=${limit}`);
    return response;
  },

  // Lấy reviews của user
  getMyReviews: async () => {
    const response = await api.get('/reviews/my');
    return response;
  },

  // Lấy sản phẩm chờ đánh giá
  getPendingReviews: async () => {
    const response = await api.get('/reviews/pending');
    return response;
  },

  // Lấy số lượng sản phẩm chờ đánh giá
  getPendingReviewsCount: async () => {
    const response = await api.get('/reviews/pending/count');
    return response;
  },

  // Gửi đánh giá
  createReview: async (data) => {
    const response = await api.post('/reviews', data);
    return response;
  },
};

export default reviewService;
