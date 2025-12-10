const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const {
  getProducts,
  getProductDetail,
  getProductsByCategory,
  searchProducts,
  getFeaturedProducts,
  getNewProducts
} = require('../controllers/productController');

// GET /api/products - Lấy danh sách sản phẩm
router.get('/', optionalAuth, getProducts);

// GET /api/products/search - Tìm kiếm sản phẩm
router.get('/search', searchProducts);

// GET /api/products/featured - Sản phẩm nổi bật
router.get('/featured', getFeaturedProducts);

// GET /api/products/new - Sản phẩm mới
router.get('/new', getNewProducts);

// GET /api/products/category/:categorySlug - Sản phẩm theo danh mục
router.get('/category/:categorySlug', getProductsByCategory);

// GET /api/products/:idOrSlug - Chi tiết sản phẩm
router.get('/:idOrSlug', getProductDetail);

module.exports = router;
