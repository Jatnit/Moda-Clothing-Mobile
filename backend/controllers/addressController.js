const { pool } = require('../config/database');

/**
 * Lấy danh sách địa chỉ của user
 * GET /api/addresses
 */
const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;

    const [addresses] = await pool.execute(`
      SELECT Id, RecipientName, PhoneNumber, AddressLine, Ward, District, City, IsDefault
      FROM UserAddresses
      WHERE UserId = ?
      ORDER BY IsDefault DESC, Id DESC
    `, [userId]);

    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Thêm địa chỉ mới
 * POST /api/addresses
 */
const addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipientName, phoneNumber, addressLine, ward, district, city, isDefault } = req.body;

    // Nếu đặt làm mặc định, bỏ mặc định các địa chỉ khác
    if (isDefault) {
      await pool.execute(
        'UPDATE UserAddresses SET IsDefault = 0 WHERE UserId = ?',
        [userId]
      );
    }

    const [result] = await pool.execute(`
      INSERT INTO UserAddresses (UserId, RecipientName, PhoneNumber, AddressLine, Ward, District, City, IsDefault)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, recipientName, phoneNumber, addressLine, ward, district, city, isDefault ? 1 : 0]);

    res.status(201).json({
      success: true,
      message: 'Thêm địa chỉ thành công!',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Cập nhật địa chỉ
 * PUT /api/addresses/:id
 */
const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { recipientName, phoneNumber, addressLine, ward, district, city, isDefault } = req.body;

    // Kiểm tra địa chỉ thuộc về user
    const [existing] = await pool.execute(
      'SELECT Id FROM UserAddresses WHERE Id = ? AND UserId = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ.'
      });
    }

    // Nếu đặt làm mặc định
    if (isDefault) {
      await pool.execute(
        'UPDATE UserAddresses SET IsDefault = 0 WHERE UserId = ?',
        [userId]
      );
    }

    await pool.execute(`
      UPDATE UserAddresses 
      SET RecipientName = ?, PhoneNumber = ?, AddressLine = ?, Ward = ?, District = ?, City = ?, IsDefault = ?
      WHERE Id = ? AND UserId = ?
    `, [recipientName, phoneNumber, addressLine, ward, district, city, isDefault ? 1 : 0, id, userId]);

    res.json({
      success: true,
      message: 'Cập nhật địa chỉ thành công!'
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Xóa địa chỉ
 * DELETE /api/addresses/:id
 */
const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM UserAddresses WHERE Id = ? AND UserId = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ.'
      });
    }

    res.json({
      success: true,
      message: 'Xóa địa chỉ thành công!'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Đặt địa chỉ mặc định
 * PUT /api/addresses/:id/default
 */
const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Kiểm tra địa chỉ thuộc về user
    const [existing] = await pool.execute(
      'SELECT Id FROM UserAddresses WHERE Id = ? AND UserId = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ.'
      });
    }

    // Bỏ mặc định tất cả
    await pool.execute(
      'UPDATE UserAddresses SET IsDefault = 0 WHERE UserId = ?',
      [userId]
    );

    // Set mặc định cho địa chỉ này
    await pool.execute(
      'UPDATE UserAddresses SET IsDefault = 1 WHERE Id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Đã đặt làm địa chỉ mặc định!'
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};
