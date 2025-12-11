import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'moda_access_token';
const REFRESH_TOKEN_KEY = 'moda_refresh_token';
const USER_KEY = 'moda_user';

export const authService = {
  // Đăng nhập
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    
    if (response.success && response.data) {
      // Lưu tokens và user info
      await AsyncStorage.setItem(TOKEN_KEY, response.data.accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
    }
    
    return response;
  },

  // Đăng ký
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    
    if (response.success && response.data) {
      // Lưu tokens và user info
      await AsyncStorage.setItem(TOKEN_KEY, response.data.accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
    }
    
    return response;
  },

  // Đăng xuất
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.log('Logout API error:', error);
    }
    
    // Xóa tokens
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
  },

  // Lấy thông tin user hiện tại
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response;
  },

  // Lấy token đã lưu
  getToken: async () => {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },

  // Lấy user đã lưu
  getStoredUser: async () => {
    const user = await AsyncStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  // Kiểm tra đã đăng nhập chưa
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
  },

  // Đổi mật khẩu
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response;
  },

  // Cập nhật profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    
    if (response.success && response.data) {
      // Cập nhật user trong storage
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
    }
    
    return response;
  },
};

export default authService;
