import axios from 'axios';
import { Platform } from 'react-native';

// Base URL cho API - thay đổi theo môi trường
const getBaseUrl = () => {
  if (__DEV__) {
    // Development
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8080/api'; // Android Emulator
    }
    return 'http://localhost:8080/api'; // iOS Simulator
  }
  // Production
  return 'https://your-production-api.com/api';
};

export const API_URL = getBaseUrl();

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - thêm token vào header
api.interceptors.request.use(
  (config) => {
    // TODO: Lấy token từ AsyncStorage
    // const token = await AsyncStorage.getItem('accessToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
