const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getProductReviews,
  createReview,
  getMyReviews
} = require('../controllers/reviewController');

// Middleware validate
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array()
    });
  }
  next();
};

// Validation rules
const createReviewValidation = [
  body('productId')
    .isInt({ min: 1 })
    .withMessage('Product ID không hợp lệ'),
  body('orderId')
    .isInt({ min: 1 })
    .withMessage('Order ID không hợp lệ'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating phải từ 1-5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Nhận xét tối đa 1000 ký tự'),
  body('images')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Tối đa 5 hình ảnh')
];

// GET /api/reviews/product/:productId - Lấy reviews của sản phẩm (public)
router.get('/product/:productId', getProductReviews);

// GET /api/reviews/my - Lấy reviews của user (authenticated)
router.get('/my', authenticate, getMyReviews);

// POST /api/reviews - Tạo review (authenticated)
router.post('/', authenticate, createReviewValidation, validate, createReview);

module.exports = router;
