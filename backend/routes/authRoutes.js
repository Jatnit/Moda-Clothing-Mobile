const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  changePassword,
  updateProfile
} = require('../controllers/authController');

// Middleware validate request
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
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Họ tên không được để trống')
    .isLength({ min: 2, max: 100 })
    .withMessage('Họ tên phải từ 2-100 ký tự'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username phải từ 3-50 ký tự'),
  body('phone')
    .optional()
    .isMobilePhone('vi-VN')
    .withMessage('Số điện thoại không hợp lệ')
];

const loginValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email/Username không được để trống'),
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được để trống')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mật khẩu hiện tại không được để trống'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
];

const updateProfileValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Họ tên phải từ 2-100 ký tự'),
  body('phone')
    .optional()
    .isMobilePhone('vi-VN')
    .withMessage('Số điện thoại không hợp lệ'),
  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('URL avatar không hợp lệ')
];

// Routes
// POST /api/auth/register - Đăng ký
router.post('/register', registerValidation, validate, register);

// POST /api/auth/login - Đăng nhập
router.post('/login', loginValidation, validate, login);

// POST /api/auth/refresh-token - Làm mới token
router.post('/refresh-token', refreshToken);

// POST /api/auth/logout - Đăng xuất (cần authenticate)
router.post('/logout', authenticate, logout);

// GET /api/auth/me - Lấy thông tin user hiện tại
router.get('/me', authenticate, getMe);

// PUT /api/auth/change-password - Đổi mật khẩu
router.put('/change-password', authenticate, changePasswordValidation, validate, changePassword);

// PUT /api/auth/profile - Cập nhật thông tin profile
router.put('/profile', authenticate, updateProfileValidation, validate, updateProfile);

module.exports = router;
