const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/auth');

// Tất cả routes đều yêu cầu đăng nhập
router.use(authenticate);

// GET /api/wishlist - Lấy danh sách yêu thích
router.get('/', wishlistController.getWishlist);

// POST /api/wishlist/:productId - Thêm sản phẩm vào yêu thích
router.post('/:productId', wishlistController.addToWishlist);

// DELETE /api/wishlist/:productId - Xóa sản phẩm khỏi yêu thích
router.delete('/:productId', wishlistController.removeFromWishlist);

// GET /api/wishlist/check/:productId - Kiểm tra sản phẩm có trong yêu thích không
router.get('/check/:productId', wishlistController.checkInWishlist);

// POST /api/wishlist/toggle/:productId - Toggle yêu thích (thêm hoặc xóa)
router.post('/toggle/:productId', wishlistController.toggleWishlist);

module.exports = router;
