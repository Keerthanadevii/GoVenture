// src/services/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Replace with your computer's LAN IP if running on physical device
// const LAN_IP = '192.168.29.13'; 

// Centralized API URL
export const API_URL = 'http://10.125.144.164:8000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add a request interceptor to log outgoing requests
api.interceptors.request.use(request => {
  console.log('--- Outgoing Request ---');
  console.log('URL:', request.baseURL + (request.url || ''));
  console.log('Method:', request.method?.toUpperCase());
  return request;
});

// Helper to set auth token for requests
export const setAuthToken = async (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    await AsyncStorage.setItem('authToken', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    await AsyncStorage.removeItem('authToken');
  }
};

// Initialize token from storage on app start
AsyncStorage.getItem('userInfo').then(data => {
  if (data) {
    const { token } = JSON.parse(data);
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
});

export default api;
