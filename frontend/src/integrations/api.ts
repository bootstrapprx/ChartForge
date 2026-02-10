import axios, { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

// NOTE: This is a legacy axios-based API wrapper. Prefer using @/lib/api for new code.
// The baseURL should NOT include /api/v1 - routes should specify the full path.
const ENV_API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

const api = axios.create({
  baseURL: `${ENV_API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('chartforge_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for consistent error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('chartforge_token');
      localStorage.removeItem('chartforge_user');
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }

    const apiError: ApiError = {
      message: error.response?.data?.message || (typeof error.response?.data?.details === 'string' ? error.response?.data?.details : null) || error.message || 'An unexpected error occurred.',
      details: error.response?.data?.details,
    };
    return Promise.reject(apiError);
  }
);

export default api;
