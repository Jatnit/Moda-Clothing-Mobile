import api from '../config/api';

export const productService = {
  // Lấy danh sách sản phẩm
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response;
  },

  // Lấy chi tiết sản phẩm
  getProductDetail: async (idOrSlug) => {
    const response = await api.get(`/products/${idOrSlug}`);
    return response;
  },

  // Lấy sản phẩm nổi bật
  getFeaturedProducts: async (limit = 8) => {
    const response = await api.get('/products/featured', { params: { limit } });
    return response;
  },

  // Lấy sản phẩm mới
  getNewProducts: async (limit = 8) => {
    const response = await api.get('/products/new', { params: { limit } });
    return response;
  },

  // Tìm kiếm sản phẩm
  searchProducts: async (query, params = {}) => {
    const response = await api.get('/products/search', { 
      params: { q: query, ...params } 
    });
    return response;
  },

  // Lấy sản phẩm theo danh mục
  getProductsByCategory: async (categorySlug, params = {}) => {
    const response = await api.get(`/products/category/${categorySlug}`, { params });
    return response;
  },
};

export const categoryService = {
  // Lấy tất cả danh mục
  getCategories: async () => {
    const response = await api.get('/categories');
    return response;
  },

  // Lấy chi tiết danh mục
  getCategoryDetail: async (idOrSlug) => {
    const response = await api.get(`/categories/${idOrSlug}`);
    return response;
  },
};
