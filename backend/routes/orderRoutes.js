const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getOrders,
  getOrderDetail,
  createOrder,
  cancelOrder
} = require('../controllers/orderController');

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
const createOrderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Giỏ hàng không được trống'),
  body('items.*.skuId')
    .isInt({ min: 1 })
    .withMessage('SKU ID không hợp lệ'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Số lượng phải >= 1'),
  body('shippingName')
    .trim()
    .notEmpty()
    .withMessage('Tên người nhận không được để trống'),
  body('shippingPhone')
    .notEmpty()
    .withMessage('Số điện thoại không được để trống'),
  body('shippingAddress')
    .trim()
    .notEmpty()
    .withMessage('Địa chỉ giao hàng không được để trống'),
  body('paymentMethod')
    .optional()
    .isIn(['COD', 'Banking', 'VNPAY', 'MOMO'])
    .withMessage('Phương thức thanh toán không hợp lệ')
];

// All routes require authentication
router.use(authenticate);

// GET /api/orders - Lấy danh sách đơn hàng
router.get('/', getOrders);

// POST /api/orders - Tạo đơn hàng mới
router.post('/', createOrderValidation, validate, createOrder);

// GET /api/orders/:id - Chi tiết đơn hàng
router.get('/:id', getOrderDetail);

// PUT /api/orders/:id/cancel - Hủy đơn hàng
router.put('/:id/cancel', cancelOrder);

module.exports = router;
