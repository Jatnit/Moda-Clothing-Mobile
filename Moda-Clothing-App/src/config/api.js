import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// ⚠️ QUAN TRỌNG: Đổi IP này thành IP máy tính của bạn khi dùng điện thoại thật
// Tìm IP bằng lệnh: ipconfig getifaddr en0
const LOCAL_IP = '192.168.1.21';

// Base URL cho API
const getBaseUrl = () => {
  if (__DEV__) {
    // Kiểm tra xem có phải physical device không (Expo Go trên điện thoại thật)
    const isPhysicalDevice = !Constants.isDevice || Constants.appOwnership === 'expo';
    
    // Physical device - phải dùng IP thực
    // Expo Go trên điện thoại thật sẽ không thể connect tới localhost
    if (Platform.OS === 'ios' && Constants.appOwnership === 'expo') {
      // iOS Physical Device via Expo Go
      return `http://${LOCAL_IP}:8080/api`;
    }
    
    if (Platform.OS === 'android') {
      // Android Emulator: 10.0.2.2 maps to host localhost
      // Android Physical Device: cũng cần IP thực
      if (Constants.appOwnership === 'expo') {
        return `http://${LOCAL_IP}:8080/api`;
      }
      return 'http://10.0.2.2:8080/api';
    }
    
    // iOS Simulator hoặc Web - localhost hoạt động
    return 'http://localhost:8080/api';
  }
  // Production
  return 'https://your-production-api.com/api';
};

export const API_URL = getBaseUrl();

console.log('🔗 API URL:', API_URL);

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Tăng timeout lên 15 giây
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - thêm token vào header
api.interceptors.request.use(
  async (config) => {
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    try {
      const token = await AsyncStorage.getItem('moda_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`📥 Response:`, response.status);
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log chi tiết lỗi
    console.log('❌ API Error Details:', {
      url: originalRequest?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    
    // Nếu lỗi 401 (Unauthorized) và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Thử refresh token
        const refreshToken = await AsyncStorage.getItem('moda_refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken,
          });
          
          if (response.data.success) {
            const newToken = response.data.data.accessToken;
            await AsyncStorage.setItem('moda_access_token', newToken);
            
            // Retry request với token mới
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.log('Refresh token error:', refreshError);
        // Xóa tokens
        await AsyncStorage.multiRemove(['moda_access_token', 'moda_refresh_token', 'moda_user']);
      }
    }
    
    return Promise.reject(error.response?.data || { message: error.message });
  }
);

export default api;
