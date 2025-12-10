const { pool } = require('../config/database');

/**
 * Lấy tất cả sản phẩm với phân trang và lọc
 * GET /api/products
 */
const getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      search, 
      minPrice, 
      maxPrice,
      sortBy = 'CreatedAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE p.IsActive = 1';
    const params = [];

    // Lọc theo category
    if (category) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM ProductCategories pc 
        JOIN Categories c ON pc.CategoryId = c.Id 
        WHERE pc.ProductId = p.Id AND (c.Id = ? OR c.Slug = ?)
      )`;
      params.push(category, category);
    }

    // Tìm kiếm theo tên
    if (search) {
      whereClause += ` AND (p.Name LIKE ? OR p.Description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Lọc theo giá
    if (minPrice) {
      whereClause += ` AND p.BasePrice >= ?`;
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      whereClause += ` AND p.BasePrice <= ?`;
      params.push(parseFloat(maxPrice));
    }

    // Validate sortBy để tránh SQL injection
    const allowedSortFields = ['CreatedAt', 'BasePrice', 'Name', 'TotalSold'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'CreatedAt';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Query lấy sản phẩm
    const query = `
      SELECT 
        p.Id, p.Name, p.Slug, p.Description, p.BasePrice, 
        p.ThumbnailUrl, p.IsActive, p.TotalSold, p.CreatedAt,
        (SELECT AVG(r.Rating) FROM Reviews r WHERE r.ProductId = p.Id) as AvgRating,
        (SELECT COUNT(*) FROM Reviews r WHERE r.ProductId = p.Id) as ReviewCount
      FROM Products p
      ${whereClause}
      ORDER BY p.${sortField} ${order}
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), parseInt(offset));

    const [products] = await pool.execute(query, params);

    // Đếm tổng số sản phẩm
    const countQuery = `SELECT COUNT(*) as total FROM Products p ${whereClause}`;
    const countParams = params.slice(0, -2);
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    // Lấy categories cho mỗi sản phẩm
    for (const product of products) {
      const [categories] = await pool.execute(`
        SELECT c.Id, c.Name, c.Slug 
        FROM Categories c 
        JOIN ProductCategories pc ON c.Id = pc.CategoryId 
        WHERE pc.ProductId = ?
      `, [product.Id]);
      product.categories = categories;
    }

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Lấy chi tiết sản phẩm theo ID hoặc Slug
 * GET /api/products/:idOrSlug
 */
const getProductDetail = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    
    // Kiểm tra nếu là số thì tìm theo ID, không thì theo Slug
    const isId = !isNaN(idOrSlug);
    const whereClause = isId ? 'p.Id = ?' : 'p.Slug = ?';

    // Query lấy sản phẩm
    const [products] = await pool.execute(`
      SELECT 
        p.Id, p.Name, p.Slug, p.Description, p.BasePrice, 
        p.ThumbnailUrl, p.IsActive, p.TotalSold, p.CreatedAt,
        (SELECT AVG(r.Rating) FROM Reviews r WHERE r.ProductId = p.Id) as AvgRating,
        (SELECT COUNT(*) FROM Reviews r WHERE r.ProductId = p.Id) as ReviewCount
      FROM Products p
      WHERE ${whereClause}
    `, [idOrSlug]);

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm.'
      });
    }

    const product = products[0];

    // Lấy categories
    const [categories] = await pool.execute(`
      SELECT c.Id, c.Name, c.Slug 
      FROM Categories c 
      JOIN ProductCategories pc ON c.Id = pc.CategoryId 
      WHERE pc.ProductId = ?
    `, [product.Id]);
    product.categories = categories;

    // Lấy gallery images
    const [gallery] = await pool.execute(`
      SELECT Id, ImageUrl, DisplayOrder 
      FROM ProductGalleries 
      WHERE ProductId = ?
      ORDER BY DisplayOrder ASC
    `, [product.Id]);
    product.gallery = gallery;

    // Lấy color images
    const [colorImages] = await pool.execute(`
      SELECT pci.Id, pci.ColorValueId, pci.ImageUrl, av.Value as ColorName, av.Code as ColorCode
      FROM ProductColorImages pci
      JOIN AttributeValues av ON pci.ColorValueId = av.Id
      WHERE pci.ProductId = ?
    `, [product.Id]);
    product.colorImages = colorImages;

    // Lấy SKUs (variants) với attributes
    const [skus] = await pool.execute(`
      SELECT 
        ps.Id, ps.SkuCode, ps.Price, ps.StockQuantity,
        ps.ColorValueId, ps.SizeValueId,
        cv.Value as ColorName, cv.Code as ColorCode,
        sv.Value as SizeName
      FROM ProductSKUs ps
      JOIN AttributeValues cv ON ps.ColorValueId = cv.Id
      JOIN AttributeValues sv ON ps.SizeValueId = sv.Id
      WHERE ps.ProductId = ?
      ORDER BY cv.Id, sv.Id
    `, [product.Id]);
    product.skus = skus;

    // Lấy danh sách colors và sizes unique
    const colors = [...new Map(skus.map(sku => [sku.ColorValueId, {
      id: sku.ColorValueId,
      name: sku.ColorName,
      code: sku.ColorCode
    }])).values()];

    const sizes = [...new Map(skus.map(sku => [sku.SizeValueId, {
      id: sku.SizeValueId,
      name: sku.SizeName
    }])).values()];

    product.colors = colors;
    product.sizes = sizes;

    // Lấy reviews
    const [reviews] = await pool.execute(`
      SELECT 
        r.Id, r.Rating, r.Comment, r.CreatedAt,
        u.Id as UserId, u.Username, u.FullName, u.AvatarUrl
      FROM Reviews r
      JOIN Users u ON r.UserId = u.Id
      WHERE r.ProductId = ?
      ORDER BY r.CreatedAt DESC
      LIMIT 10
    `, [product.Id]);
    product.reviews = reviews;

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Lấy sản phẩm theo danh mục
 * GET /api/products/category/:categorySlug
 */
const getProductsByCategory = async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Lấy thông tin category
    const [categories] = await pool.execute(
      'SELECT * FROM Categories WHERE Slug = ? OR Id = ?',
      [categorySlug, categorySlug]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục.'
      });
    }

    const category = categories[0];

    // Lấy sản phẩm trong danh mục
    const [products] = await pool.execute(`
      SELECT 
        p.Id, p.Name, p.Slug, p.Description, p.BasePrice, 
        p.ThumbnailUrl, p.TotalSold, p.CreatedAt,
        (SELECT AVG(r.Rating) FROM Reviews r WHERE r.ProductId = p.Id) as AvgRating
      FROM Products p
      JOIN ProductCategories pc ON p.Id = pc.ProductId
      WHERE pc.CategoryId = ? AND p.IsActive = 1
      ORDER BY p.CreatedAt DESC
      LIMIT ? OFFSET ?
    `, [category.Id, parseInt(limit), parseInt(offset)]);

    // Đếm tổng
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM Products p
      JOIN ProductCategories pc ON p.Id = pc.ProductId
      WHERE pc.CategoryId = ? AND p.IsActive = 1
    `, [category.Id]);

    res.json({
      success: true,
      data: {
        category,
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Tìm kiếm sản phẩm
 * GET /api/products/search
 */
const searchProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự.'
      });
    }

    const offset = (page - 1) * limit;
    const searchTerm = `%${q.trim()}%`;

    const [products] = await pool.execute(`
      SELECT 
        p.Id, p.Name, p.Slug, p.Description, p.BasePrice, 
        p.ThumbnailUrl, p.TotalSold,
        (SELECT AVG(r.Rating) FROM Reviews r WHERE r.ProductId = p.Id) as AvgRating
      FROM Products p
      WHERE p.IsActive = 1 AND (p.Name LIKE ? OR p.Description LIKE ?)
      ORDER BY p.TotalSold DESC
      LIMIT ? OFFSET ?
    `, [searchTerm, searchTerm, parseInt(limit), parseInt(offset)]);

    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM Products p
      WHERE p.IsActive = 1 AND (p.Name LIKE ? OR p.Description LIKE ?)
    `, [searchTerm, searchTerm]);

    res.json({
      success: true,
      data: {
        query: q,
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Lấy sản phẩm nổi bật / bán chạy
 * GET /api/products/featured
 */
const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const [products] = await pool.execute(`
      SELECT 
        p.Id, p.Name, p.Slug, p.Description, p.BasePrice, 
        p.ThumbnailUrl, p.TotalSold,
        (SELECT AVG(r.Rating) FROM Reviews r WHERE r.ProductId = p.Id) as AvgRating
      FROM Products p
      WHERE p.IsActive = 1
      ORDER BY p.TotalSold DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Lấy sản phẩm mới nhất
 * GET /api/products/new
 */
const getNewProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const [products] = await pool.execute(`
      SELECT 
        p.Id, p.Name, p.Slug, p.Description, p.BasePrice, 
        p.ThumbnailUrl, p.TotalSold,
        (SELECT AVG(r.Rating) FROM Reviews r WHERE r.ProductId = p.Id) as AvgRating
      FROM Products p
      WHERE p.IsActive = 1
      ORDER BY p.CreatedAt DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get new products error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

module.exports = {
  getProducts,
  getProductDetail,
  getProductsByCategory,
  searchProducts,
  getFeaturedProducts,
  getNewProducts
};
