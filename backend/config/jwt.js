const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key_change_this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = '30d';

/**
 * Tạo Access Token
 * @param {Object} payload - Dữ liệu cần mã hóa (user info)
 * @returns {String} JWT token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'moda-clothing-api'
  });
};

/**
 * Tạo Refresh Token
 * @param {Object} payload - Dữ liệu cần mã hóa
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'moda-clothing-api'
  });
};

/**
 * Xác thực và giải mã token
 * @param {String} token - JWT token cần xác thực
 * @returns {Object} Decoded payload hoặc null nếu không hợp lệ
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Tính thời gian hết hạn của refresh token
 * @returns {Date} Thời điểm hết hạn
 */
const getRefreshTokenExpiry = () => {
  const days = parseInt(JWT_REFRESH_EXPIRES_IN.replace('d', '')) || 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  getRefreshTokenExpiry,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
