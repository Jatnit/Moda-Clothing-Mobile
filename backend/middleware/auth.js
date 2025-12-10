const { verifyToken } = require('../config/jwt');
const { pool } = require('../config/database');

/**
 * Middleware xác thực JWT token
 * Kiểm tra token trong header Authorization: Bearer <token>
 */
const authenticate = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token. Vui lòng đăng nhập.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Xác thực token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn.'
      });
    }

    // Kiểm tra user có tồn tại không
    const [users] = await pool.execute(
      `SELECT u.Id, u.Email, u.Username, u.FullName, r.RoleName 
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

    // Gắn thông tin user vào request
    req.user = {
      id: user.Id,
      email: user.Email,
      username: user.Username,
      fullName: user.FullName,
      role: user.RoleName
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực.'
    });
  }
};

/**
 * Middleware kiểm tra quyền admin
 */
const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền thực hiện hành động này.'
    });
  }
};

/**
 * Middleware optional auth - không bắt buộc đăng nhập
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      
      if (decoded) {
        const [users] = await pool.execute(
          `SELECT u.Id, u.Email, u.Username, u.FullName, r.RoleName 
           FROM Users u 
           LEFT JOIN Roles r ON u.RoleId = r.Id 
           WHERE u.Id = ?`,
          [decoded.userId]
        );

        if (users.length > 0) {
          req.user = {
            id: users[0].Id,
            email: users[0].Email,
            username: users[0].Username,
            fullName: users[0].FullName,
            role: users[0].RoleName
          };
        }
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticate,
  isAdmin,
  optionalAuth
};
