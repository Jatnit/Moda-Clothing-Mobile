const { pool } = require('../config/database');

/**
 * Lấy giỏ hàng của user
 * GET /api/cart
 */
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const [items] = await pool.execute(`
      SELECT 
        c.Id as CartId,
        c.ProductSkuId as SkuId,
        c.Quantity,
        c.CreatedAt,
        ps.Price,
        ps.StockQuantity,
        p.Id as ProductId,
        p.Name as ProductName,
        p.Slug,
        p.ThumbnailUrl,
        cv.Value as ColorName,
        sv.Value as SizeName
      FROM Cart c
      JOIN ProductSKUs ps ON c.ProductSkuId = ps.Id
      JOIN Products p ON ps.ProductId = p.Id
      LEFT JOIN AttributeValues cv ON ps.ColorValueId = cv.Id
      LEFT JOIN AttributeValues sv ON ps.SizeValueId = sv.Id
      WHERE c.UserId = ?
      ORDER BY c.CreatedAt DESC
    `, [userId]);

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.Price * item.Quantity), 0);

    res.json({
      success: true,
      data: {
        items,
        total,
        itemCount: items.length
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Thêm sản phẩm vào giỏ hàng
 * POST /api/cart
 */
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { skuId, quantity = 1 } = req.body;

    if (!skuId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn sản phẩm.'
      });
    }

    // Kiểm tra SKU tồn tại và còn hàng
    const [skus] = await pool.execute(`
      SELECT ps.Id, ps.Price, ps.StockQuantity, p.Name
      FROM ProductSKUs ps
      JOIN Products p ON ps.ProductId = p.Id
      WHERE ps.Id = ?
    `, [skuId]);

    if (skus.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại.'
      });
    }

    const sku = skus[0];

    if (sku.StockQuantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Sản phẩm chỉ còn ${sku.StockQuantity} sản phẩm trong kho.`
      });
    }

    // Kiểm tra đã có trong giỏ hàng chưa
    const [existing] = await pool.execute(`
      SELECT Id, Quantity FROM Cart WHERE UserId = ? AND ProductSkuId = ?
    `, [userId, skuId]);

    if (existing.length > 0) {
      // Cập nhật số lượng
      const newQuantity = existing[0].Quantity + quantity;
      
      if (newQuantity > sku.StockQuantity) {
        return res.status(400).json({
          success: false,
          message: `Không thể thêm. Số lượng tối đa là ${sku.StockQuantity}.`
        });
      }

      await pool.execute(`
        UPDATE Cart SET Quantity = ? WHERE Id = ?
      `, [newQuantity, existing[0].Id]);

      res.json({
        success: true,
        message: 'Đã cập nhật số lượng trong giỏ hàng.',
        data: { cartId: existing[0].Id, quantity: newQuantity }
      });
    } else {
      // Thêm mới
      const [result] = await pool.execute(`
        INSERT INTO Cart (UserId, ProductSkuId, Quantity)
        VALUES (?, ?, ?)
      `, [userId, skuId, quantity]);

      res.status(201).json({
        success: true,
        message: 'Đã thêm vào giỏ hàng!',
        data: { cartId: result.insertId, quantity }
      });
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Cập nhật số lượng sản phẩm trong giỏ
 * PUT /api/cart/:cartId
 */
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cartId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng không hợp lệ.'
      });
    }

    // Kiểm tra cart item thuộc về user
    const [items] = await pool.execute(`
      SELECT c.Id, c.ProductSkuId, ps.StockQuantity
      FROM Cart c
      JOIN ProductSKUs ps ON c.ProductSkuId = ps.Id
      WHERE c.Id = ? AND c.UserId = ?
    `, [cartId, userId]);

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong giỏ hàng.'
      });
    }

    const item = items[0];

    if (quantity > item.StockQuantity) {
      return res.status(400).json({
        success: false,
        message: `Số lượng tối đa là ${item.StockQuantity}.`
      });
    }

    await pool.execute(`
      UPDATE Cart SET Quantity = ? WHERE Id = ?
    `, [quantity, cartId]);

    res.json({
      success: true,
      message: 'Đã cập nhật số lượng.',
      data: { cartId: parseInt(cartId), quantity }
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Xóa sản phẩm khỏi giỏ hàng
 * DELETE /api/cart/:cartId
 */
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cartId } = req.params;

    // Kiểm tra và xóa
    const [result] = await pool.execute(`
      DELETE FROM Cart WHERE Id = ? AND UserId = ?
    `, [cartId, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong giỏ hàng.'
      });
    }

    res.json({
      success: true,
      message: 'Đã xóa khỏi giỏ hàng.'
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Xóa toàn bộ giỏ hàng
 * DELETE /api/cart
 */
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.execute(`
      DELETE FROM Cart WHERE UserId = ?
    `, [userId]);

    res.json({
      success: true,
      message: 'Đã xóa giỏ hàng.'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Lấy số lượng sản phẩm trong giỏ
 * GET /api/cart/count
 */
const getCartCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await pool.execute(`
      SELECT COALESCE(SUM(Quantity), 0) as count
      FROM Cart
      WHERE UserId = ?
    `, [userId]);

    res.json({
      success: true,
      data: { count: result[0].count }
    });
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount
};
