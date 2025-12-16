const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount
} = require('../controllers/cartController');

// Tất cả routes đều yêu cầu đăng nhập
router.use(authenticate);

// GET /api/cart - Lấy giỏ hàng
router.get('/', getCart);

// GET /api/cart/count - Lấy số lượng trong giỏ
router.get('/count', getCartCount);

// POST /api/cart - Thêm sản phẩm vào giỏ
router.post('/', addToCart);

// PUT /api/cart/:cartId - Cập nhật số lượng
router.put('/:cartId', updateCartItem);

// DELETE /api/cart/:cartId - Xóa sản phẩm khỏi giỏ
router.delete('/:cartId', removeFromCart);

// DELETE /api/cart - Xóa toàn bộ giỏ hàng
router.delete('/', clearCart);

module.exports = router;
