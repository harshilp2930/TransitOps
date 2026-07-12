import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const access = Cookies.get('access_token');
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = Cookies.get('refresh_token');

      if (!refresh) {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        Cookies.remove('user_data');
        const publicPaths = ['/login', '/register', '/forgot-password'];
        if (typeof window !== 'undefined' && !publicPaths.includes(window.location.pathname)) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh,
        });
        const nextAccess = refreshResponse.data.access;
        Cookies.set('access_token', nextAccess, { expires: 1 / 24 });

        originalRequest.headers.Authorization = `Bearer ${nextAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        Cookies.remove('user_data');
        const publicPaths = ['/login', '/register', '/forgot-password'];
        if (typeof window !== 'undefined' && !publicPaths.includes(window.location.pathname)) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
