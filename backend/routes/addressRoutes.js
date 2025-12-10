const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} = require('../controllers/addressController');

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
const addressValidation = [
  body('recipientName')
    .trim()
    .notEmpty()
    .withMessage('Tên người nhận không được để trống'),
  body('phoneNumber')
    .notEmpty()
    .withMessage('Số điện thoại không được để trống'),
  body('addressLine')
    .trim()
    .notEmpty()
    .withMessage('Địa chỉ không được để trống'),
  body('district')
    .trim()
    .notEmpty()
    .withMessage('Quận/Huyện không được để trống'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('Tỉnh/Thành phố không được để trống')
];

// All routes require authentication
router.use(authenticate);

// GET /api/addresses - Lấy danh sách địa chỉ
router.get('/', getAddresses);

// POST /api/addresses - Thêm địa chỉ mới
router.post('/', addressValidation, validate, addAddress);

// PUT /api/addresses/:id - Cập nhật địa chỉ
router.put('/:id', addressValidation, validate, updateAddress);

// DELETE /api/addresses/:id - Xóa địa chỉ
router.delete('/:id', deleteAddress);

// PUT /api/addresses/:id/default - Đặt địa chỉ mặc định
router.put('/:id/default', setDefaultAddress);

module.exports = router;
