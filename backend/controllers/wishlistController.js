const { pool } = require('../config/database');

const wishlistController = {
  // Lấy danh sách yêu thích
  getWishlist: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const [wishlist] = await pool.execute(`
        SELECT 
          w.Id,
          w.CreatedAt as AddedAt,
          p.Id as ProductId,
          p.Name as ProductName,
          p.Slug,
          p.BasePrice as Price,
          p.ThumbnailUrl as ImageUrl,
          p.IsActive,
          (SELECT AVG(r.Rating) FROM Reviews r WHERE r.ProductId = p.Id) as AvgRating,
          (SELECT COUNT(*) FROM Reviews r WHERE r.ProductId = p.Id) as ReviewCount,
          p.TotalSold as SoldCount
        FROM Wishlist w
        JOIN Products p ON w.ProductId = p.Id
        WHERE w.UserId = ?
        ORDER BY w.CreatedAt DESC
      `, [userId]);

      res.json({
        success: true,
        data: {
          items: wishlist,
          total: wishlist.length
        }
      });
    } catch (error) {
      console.error('Error getting wishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể lấy danh sách yêu thích'
      });
    }
  },

  // Thêm sản phẩm vào yêu thích
  addToWishlist: async (req, res) => {
    try {
      const userId = req.user.id;
      const { productId } = req.params;

      // Kiểm tra sản phẩm tồn tại
      const [product] = await pool.execute(
        'SELECT Id, Name FROM Products WHERE Id = ? AND IsActive = 1',
        [productId]
      );

      if (product.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sản phẩm không tồn tại'
        });
      }

      // Kiểm tra đã có trong wishlist chưa
      const [existing] = await pool.execute(
        'SELECT Id FROM Wishlist WHERE UserId = ? AND ProductId = ?',
        [userId, productId]
      );

      if (existing.length > 0) {
        return res.json({
          success: true,
          message: 'Sản phẩm đã có trong danh sách yêu thích',
          data: { isInWishlist: true }
        });
      }

      // Thêm vào wishlist
      await pool.execute(
        'INSERT INTO Wishlist (UserId, ProductId, CreatedAt) VALUES (?, ?, NOW())',
        [userId, productId]
      );

      res.json({
        success: true,
        message: `Đã thêm "${product[0].Name}" vào danh sách yêu thích`,
        data: { isInWishlist: true }
      });
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể thêm vào danh sách yêu thích'
      });
    }
  },

  // Xóa sản phẩm khỏi yêu thích
  removeFromWishlist: async (req, res) => {
    try {
      const userId = req.user.id;
      const { productId } = req.params;

      const [result] = await pool.execute(
        'DELETE FROM Wishlist WHERE UserId = ? AND ProductId = ?',
        [userId, productId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sản phẩm không có trong danh sách yêu thích'
        });
      }

      res.json({
        success: true,
        message: 'Đã xóa khỏi danh sách yêu thích',
        data: { isInWishlist: false }
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể xóa khỏi danh sách yêu thích'
      });
    }
  },

  // Kiểm tra sản phẩm có trong yêu thích không
  checkInWishlist: async (req, res) => {
    try {
      const userId = req.user.id;
      const { productId } = req.params;

      const [existing] = await pool.execute(
        'SELECT Id FROM Wishlist WHERE UserId = ? AND ProductId = ?',
        [userId, productId]
      );

      res.json({
        success: true,
        data: { isInWishlist: existing.length > 0 }
      });
    } catch (error) {
      console.error('Error checking wishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể kiểm tra danh sách yêu thích'
      });
    }
  },

  // Toggle yêu thích (thêm nếu chưa có, xóa nếu đã có)
  toggleWishlist: async (req, res) => {
    try {
      const userId = req.user.id;
      const { productId } = req.params;

      // Kiểm tra sản phẩm tồn tại
      const [product] = await pool.execute(
        'SELECT Id, Name FROM Products WHERE Id = ? AND IsActive = 1',
        [productId]
      );

      if (product.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sản phẩm không tồn tại'
        });
      }

      // Kiểm tra đã có trong wishlist chưa
      const [existing] = await pool.execute(
        'SELECT Id FROM Wishlist WHERE UserId = ? AND ProductId = ?',
        [userId, productId]
      );

      if (existing.length > 0) {
        // Đã có -> Xóa
        await pool.execute(
          'DELETE FROM Wishlist WHERE UserId = ? AND ProductId = ?',
          [userId, productId]
        );
        
        res.json({
          success: true,
          message: `Đã xóa "${product[0].Name}" khỏi danh sách yêu thích`,
          data: { isInWishlist: false }
        });
      } else {
        // Chưa có -> Thêm
        await pool.execute(
          'INSERT INTO Wishlist (UserId, ProductId, CreatedAt) VALUES (?, ?, NOW())',
          [userId, productId]
        );
        
        res.json({
          success: true,
          message: `Đã thêm "${product[0].Name}" vào danh sách yêu thích`,
          data: { isInWishlist: true }
        });
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể cập nhật danh sách yêu thích'
      });
    }
  },
};

module.exports = wishlistController;
