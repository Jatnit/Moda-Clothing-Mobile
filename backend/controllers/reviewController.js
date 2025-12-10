const { pool } = require('../config/database');

/**
 * Lấy reviews của sản phẩm
 * GET /api/reviews/product/:productId
 */
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [reviews] = await pool.execute(`
      SELECT 
        r.Id, r.Rating, r.Comment, r.CreatedAt,
        u.Id as UserId, u.Username, u.FullName, u.AvatarUrl,
        (SELECT GROUP_CONCAT(ri.ImageUrl) FROM ReviewImages ri WHERE ri.ReviewId = r.Id) as Images
      FROM Reviews r
      JOIN Users u ON r.UserId = u.Id
      WHERE r.ProductId = ?
      ORDER BY r.CreatedAt DESC
      LIMIT ? OFFSET ?
    `, [productId, parseInt(limit), parseInt(offset)]);

    // Parse images string thành array
    reviews.forEach(r => {
      r.Images = r.Images ? r.Images.split(',') : [];
    });

    // Đếm tổng và tính thống kê rating
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        AVG(Rating) as avgRating,
        SUM(CASE WHEN Rating = 5 THEN 1 ELSE 0 END) as star5,
        SUM(CASE WHEN Rating = 4 THEN 1 ELSE 0 END) as star4,
        SUM(CASE WHEN Rating = 3 THEN 1 ELSE 0 END) as star3,
        SUM(CASE WHEN Rating = 2 THEN 1 ELSE 0 END) as star2,
        SUM(CASE WHEN Rating = 1 THEN 1 ELSE 0 END) as star1
      FROM Reviews
      WHERE ProductId = ?
    `, [productId]);

    res.json({
      success: true,
      data: {
        reviews,
        stats: stats[0],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: stats[0].total,
          totalPages: Math.ceil(stats[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Tạo review cho sản phẩm (sau khi mua hàng)
 * POST /api/reviews
 */
const createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, orderId, rating, comment, images } = req.body;

    // Kiểm tra đã mua sản phẩm chưa
    const [orderCheck] = await pool.execute(`
      SELECT o.Id 
      FROM Orders o
      JOIN OrderDetails od ON o.Id = od.OrderId
      JOIN ProductSKUs ps ON od.ProductSkuId = ps.Id
      WHERE o.Id = ? AND o.UserId = ? AND ps.ProductId = ? AND o.Status = 'Hoàn thành'
    `, [orderId, userId, productId]);

    if (orderCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Bạn cần mua và nhận hàng mới có thể đánh giá sản phẩm này.'
      });
    }

    // Kiểm tra đã review chưa
    const [existingReview] = await pool.execute(`
      SELECT Id FROM Reviews WHERE UserId = ? AND ProductId = ? AND OrderId = ?
    `, [userId, productId, orderId]);

    if (existingReview.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá sản phẩm này rồi.'
      });
    }

    // Tạo review
    const [result] = await pool.execute(`
      INSERT INTO Reviews (UserId, ProductId, OrderId, Rating, Comment)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, productId, orderId, rating, comment]);

    const reviewId = result.insertId;

    // Thêm images nếu có
    if (images && images.length > 0) {
      for (const imageUrl of images) {
        await pool.execute(`
          INSERT INTO ReviewImages (ReviewId, ImageUrl) VALUES (?, ?)
        `, [reviewId, imageUrl]);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Cảm ơn bạn đã đánh giá!',
      data: { reviewId }
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Lấy reviews của user
 * GET /api/reviews/my
 */
const getMyReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    const [reviews] = await pool.execute(`
      SELECT 
        r.Id, r.Rating, r.Comment, r.CreatedAt,
        r.ProductId, p.Name as ProductName, p.Slug, p.ThumbnailUrl,
        (SELECT GROUP_CONCAT(ri.ImageUrl) FROM ReviewImages ri WHERE ri.ReviewId = r.Id) as Images
      FROM Reviews r
      JOIN Products p ON r.ProductId = p.Id
      WHERE r.UserId = ?
      ORDER BY r.CreatedAt DESC
    `, [userId]);

    reviews.forEach(r => {
      r.Images = r.Images ? r.Images.split(',') : [];
    });

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

module.exports = {
  getProductReviews,
  createReview,
  getMyReviews
};
