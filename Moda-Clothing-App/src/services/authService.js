import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'moda_access_token';
const REFRESH_TOKEN_KEY = 'moda_refresh_token';
const USER_KEY = 'moda_user';

// Chuẩn hóa user data từ API sang format app sử dụng
const normalizeUser = (apiUser) => {
  if (!apiUser) return null;
  
  return {
    Id: apiUser.id || apiUser.Id,
    Username: apiUser.username || apiUser.Username,
    Email: apiUser.email || apiUser.Email,
    FullName: apiUser.fullName || apiUser.FullName,
    PhoneNumber: apiUser.phone || apiUser.PhoneNumber || apiUser.phoneNumber,
    AvatarUrl: apiUser.avatarUrl || apiUser.AvatarUrl,
    Role: apiUser.role || apiUser.Role,
    CreatedAt: apiUser.createdAt || apiUser.CreatedAt,
  };
};

export const authService = {
  // Đăng nhập
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    
    if (response.success && response.data) {
      const normalizedUser = normalizeUser(response.data.user);
      
      // Lưu tokens và user info
      await AsyncStorage.setItem(TOKEN_KEY, response.data.accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
      
      // Cập nhật response với normalized user
      response.data.user = normalizedUser;
    }
    
    return response;
  },

  // Đăng ký
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    
    if (response.success && response.data) {
      const normalizedUser = normalizeUser(response.data.user);
      
      // Lưu tokens và user info
      await AsyncStorage.setItem(TOKEN_KEY, response.data.accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
      
      // Cập nhật response với normalized user
      response.data.user = normalizedUser;
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

  // Lấy thông tin user hiện tại từ API
  getMe: async () => {
    const response = await api.get('/auth/me');
    
    if (response.success && response.data) {
      const normalizedUser = normalizeUser(response.data);
      response.data = normalizedUser;
      
      // Cập nhật user trong storage
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
    }
    
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
      const normalizedUser = normalizeUser(response.data);
      
      // Cập nhật user trong storage
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
      
      // Trả về normalized user
      response.data = { user: normalizedUser };
    }
    
    return response;
  },
};

export default authService;
