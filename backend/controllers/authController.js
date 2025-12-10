const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyToken,
  getRefreshTokenExpiry 
} = require('../config/jwt');

// Default role ID for new users (Customer role)
const DEFAULT_ROLE_ID = 3; // Customer role trong database

/**
 * Đăng ký tài khoản mới
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password, fullName, phone, username } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const [existingEmails] = await pool.execute(
      'SELECT Id FROM Users WHERE Email = ?',
      [email]
    );

    if (existingEmails.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng.'
      });
    }

    // Kiểm tra username đã tồn tại chưa
    const usernameToUse = username || email.split('@')[0];
    const [existingUsernames] = await pool.execute(
      'SELECT Id FROM Users WHERE Username = ?',
      [usernameToUse]
    );

    if (existingUsernames.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username đã được sử dụng.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo user mới
    const [result] = await pool.execute(
      `INSERT INTO Users (Username, PasswordHash, Email, FullName, PhoneNumber, RoleId) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [usernameToUse, hashedPassword, email, fullName, phone || null, DEFAULT_ROLE_ID]
    );

    const userId = result.insertId;

    // Lấy thông tin role
    const [roles] = await pool.execute(
      'SELECT RoleName FROM Roles WHERE Id = ?',
      [DEFAULT_ROLE_ID]
    );
    const roleName = roles.length > 0 ? roles[0].RoleName : 'user';

    // Tạo tokens
    const accessToken = generateAccessToken({ 
      userId, 
      email,
      role: roleName 
    });
    const refreshToken = generateRefreshToken({ userId });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công!',
      data: {
        user: {
          id: userId,
          username: usernameToUse,
          email,
          fullName,
          phone,
          role: roleName
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Đăng nhập
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Tìm user theo email hoặc username
    const [users] = await pool.execute(
      `SELECT u.*, r.RoleName 
       FROM Users u 
       LEFT JOIN Roles r ON u.RoleId = r.Id 
       WHERE u.Email = ? OR u.Username = ?`,
      [email, email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email/Username hoặc mật khẩu không đúng.'
      });
    }

    const user = users[0];

    // So sánh password
    const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email/Username hoặc mật khẩu không đúng.'
      });
    }

    // Tạo tokens
    const accessToken = generateAccessToken({ 
      userId: user.Id, 
      email: user.Email,
      role: user.RoleName || 'user'
    });
    const refreshToken = generateRefreshToken({ userId: user.Id });

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        user: {
          id: user.Id,
          username: user.Username,
          email: user.Email,
          fullName: user.FullName,
          phone: user.PhoneNumber,
          avatarUrl: user.AvatarUrl,
          role: user.RoleName || 'user'
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Làm mới token
 * POST /api/auth/refresh-token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token không được cung cấp.'
      });
    }

    // Xác thực refresh token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token không hợp lệ hoặc đã hết hạn.'
      });
    }

    // Lấy thông tin user
    const [users] = await pool.execute(
      `SELECT u.Id, u.Email, r.RoleName 
       FROM Users u 
       LEFT JOIN Roles r ON u.RoleId = r.Id 
       WHERE u.Id = ?`,
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại.'
      });
    }

    const user = users[0];

    // Tạo token mới
    const newAccessToken = generateAccessToken({
      userId: user.Id,
      email: user.Email,
      role: user.RoleName || 'user'
    });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Đăng xuất
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    // Với stateless JWT, logout được xử lý ở client bằng cách xóa token
    // Nếu cần blacklist token, có thể thêm logic ở đây

    res.json({
      success: true,
      message: 'Đăng xuất thành công!'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Lấy thông tin user hiện tại
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT u.Id, u.Username, u.Email, u.FullName, u.PhoneNumber, u.AvatarUrl, 
              u.CreatedAt, r.RoleName
       FROM Users u 
       LEFT JOIN Roles r ON u.RoleId = r.Id 
       WHERE u.Id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.'
      });
    }

    const user = users[0];

    res.json({
      success: true,
      data: {
        id: user.Id,
        username: user.Username,
        email: user.Email,
        fullName: user.FullName,
        phone: user.PhoneNumber,
        avatarUrl: user.AvatarUrl,
        role: user.RoleName,
        createdAt: user.CreatedAt
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Đổi mật khẩu
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Lấy thông tin user
    const [users] = await pool.execute(
      'SELECT PasswordHash FROM Users WHERE Id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.'
      });
    }

    // Kiểm tra mật khẩu hiện tại
    const isPasswordValid = await bcrypt.compare(currentPassword, users[0].PasswordHash);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng.'
      });
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu
    await pool.execute(
      'UPDATE Users SET PasswordHash = ? WHERE Id = ?',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công!'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Cập nhật thông tin profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, avatarUrl } = req.body;
    const userId = req.user.id;

    // Cập nhật thông tin
    await pool.execute(
      `UPDATE Users 
       SET FullName = COALESCE(?, FullName), 
           PhoneNumber = COALESCE(?, PhoneNumber),
           AvatarUrl = COALESCE(?, AvatarUrl)
       WHERE Id = ?`,
      [fullName, phone, avatarUrl, userId]
    );

    // Lấy thông tin user sau khi cập nhật
    const [users] = await pool.execute(
      `SELECT u.Id, u.Username, u.Email, u.FullName, u.PhoneNumber, u.AvatarUrl, r.RoleName
       FROM Users u 
       LEFT JOIN Roles r ON u.RoleId = r.Id 
       WHERE u.Id = ?`,
      [userId]
    );

    const user = users[0];

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công!',
      data: {
        id: user.Id,
        username: user.Username,
        email: user.Email,
        fullName: user.FullName,
        phone: user.PhoneNumber,
        avatarUrl: user.AvatarUrl,
        role: user.RoleName
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  changePassword,
  updateProfile
};
