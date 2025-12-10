const { pool } = require('../config/database');

/**
 * Lấy danh sách đơn hàng của user
 * GET /api/orders
 */
const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE o.UserId = ?';
    const params = [userId];

    if (status) {
      whereClause += ' AND o.Status = ?';
      params.push(status);
    }

    const [orders] = await pool.execute(`
      SELECT 
        o.Id, o.OrderDate, o.TotalAmount, o.Status, 
        o.PaymentMethod, o.IsPaid, 
        o.ShippingName, o.ShippingPhone, o.ShippingAddress, o.Note,
        (SELECT COUNT(*) FROM OrderDetails od WHERE od.OrderId = o.Id) as ItemCount
      FROM Orders o
      ${whereClause}
      ORDER BY o.OrderDate DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Đếm tổng
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total FROM Orders o ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Lấy chi tiết đơn hàng
 * GET /api/orders/:id
 */
const getOrderDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [orders] = await pool.execute(`
      SELECT 
        o.Id, o.OrderDate, o.TotalAmount, o.Status, 
        o.PaymentMethod, o.IsPaid, 
        o.ShippingName, o.ShippingPhone, o.ShippingAddress, o.Note
      FROM Orders o
      WHERE o.Id = ? AND o.UserId = ?
    `, [id, userId]);

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng.'
      });
    }

    const order = orders[0];

    // Lấy chi tiết sản phẩm trong đơn hàng
    const [items] = await pool.execute(`
      SELECT 
        od.Id, od.ProductName, od.Color, od.Size, 
        od.Quantity, od.UnitPrice, od.TotalPrice,
        od.ProductSkuId,
        p.Id as ProductId, p.Slug, p.ThumbnailUrl
      FROM OrderDetails od
      LEFT JOIN ProductSKUs ps ON od.ProductSkuId = ps.Id
      LEFT JOIN Products p ON ps.ProductId = p.Id
      WHERE od.OrderId = ?
    `, [order.Id]);
    order.items = items;

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Tạo đơn hàng mới
 * POST /api/orders
 */
const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const { 
      items, // [{skuId, quantity}]
      shippingName,
      shippingPhone,
      shippingAddress,
      paymentMethod = 'COD',
      note
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Giỏ hàng trống.'
      });
    }

    // Validate và tính tổng tiền
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const [skus] = await connection.execute(`
        SELECT 
          ps.Id, ps.Price, ps.StockQuantity, ps.ProductId,
          p.Name as ProductName,
          cv.Value as ColorName,
          sv.Value as SizeName
        FROM ProductSKUs ps
        JOIN Products p ON ps.ProductId = p.Id
        JOIN AttributeValues cv ON ps.ColorValueId = cv.Id
        JOIN AttributeValues sv ON ps.SizeValueId = sv.Id
        WHERE ps.Id = ?
      `, [item.skuId]);

      if (skus.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Sản phẩm SKU ${item.skuId} không tồn tại.`
        });
      }

      const sku = skus[0];

      if (sku.StockQuantity < item.quantity) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${sku.ProductName}" (${sku.ColorName} - ${sku.SizeName}) chỉ còn ${sku.StockQuantity} sản phẩm.`
        });
      }

      totalAmount += sku.Price * item.quantity;
      orderItems.push({
        skuId: sku.Id,
        productName: sku.ProductName,
        color: sku.ColorName,
        size: sku.SizeName,
        quantity: item.quantity,
        unitPrice: sku.Price
      });
    }

    // Tạo đơn hàng
    const [orderResult] = await connection.execute(`
      INSERT INTO Orders (UserId, TotalAmount, Status, PaymentMethod, IsPaid, ShippingName, ShippingPhone, ShippingAddress, Note)
      VALUES (?, ?, 'Mới', ?, 0, ?, ?, ?, ?)
    `, [userId, totalAmount, paymentMethod, shippingName, shippingPhone, shippingAddress, note]);

    const orderId = orderResult.insertId;

    // Tạo chi tiết đơn hàng
    for (const item of orderItems) {
      await connection.execute(`
        INSERT INTO OrderDetails (OrderId, ProductSkuId, ProductName, Color, Size, Quantity, UnitPrice)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [orderId, item.skuId, item.productName, item.color, item.size, item.quantity, item.unitPrice]);

      // Giảm số lượng tồn kho
      await connection.execute(`
        UPDATE ProductSKUs SET StockQuantity = StockQuantity - ? WHERE Id = ?
      `, [item.quantity, item.skuId]);
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công!',
      data: {
        orderId,
        totalAmount,
        itemCount: orderItems.length
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  } finally {
    connection.release();
  }
};

/**
 * Hủy đơn hàng
 * PUT /api/orders/:id/cancel
 */
const cancelOrder = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const { id } = req.params;

    // Kiểm tra đơn hàng
    const [orders] = await connection.execute(`
      SELECT Id, Status FROM Orders WHERE Id = ? AND UserId = ?
    `, [id, userId]);

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng.'
      });
    }

    const order = orders[0];

    if (order.Status !== 'Mới' && order.Status !== 'Đang xử lý') {
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy đơn hàng ở trạng thái này.'
      });
    }

    // Hoàn lại số lượng tồn kho
    const [items] = await connection.execute(`
      SELECT ProductSkuId, Quantity FROM OrderDetails WHERE OrderId = ?
    `, [order.Id]);

    for (const item of items) {
      await connection.execute(`
        UPDATE ProductSKUs SET StockQuantity = StockQuantity + ? WHERE Id = ?
      `, [item.Quantity, item.ProductSkuId]);
    }

    // Cập nhật trạng thái đơn hàng
    await connection.execute(`
      UPDATE Orders SET Status = 'Đã hủy' WHERE Id = ?
    `, [order.Id]);

    await connection.commit();

    res.json({
      success: true,
      message: 'Đã hủy đơn hàng thành công.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getOrders,
  getOrderDetail,
  createOrder,
  cancelOrder
};
