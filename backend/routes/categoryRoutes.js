const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryDetail
} = require('../controllers/categoryController');

// GET /api/categories - Lấy tất cả danh mục
router.get('/', getCategories);

// GET /api/categories/:idOrSlug - Chi tiết danh mục
router.get('/:idOrSlug', getCategoryDetail);

module.exports = router;
