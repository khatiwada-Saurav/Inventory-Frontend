import axios from 'axios';
import { clearAuth, getToken, isLoggedIn } from '@/lib/auth';

const TENANT_ERROR_TYPES = new Set(['no_tenant', 'tenant_inactive']);

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// API routes that are intentionally called without a token
const PUBLIC_API_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

api.interceptors.request.use((config) => {
  if (globalThis.window !== undefined) {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // No token — redirect to login immediately for any protected endpoint
      // so we don't waste a round-trip just to get a 401 back.
      const url = config.url ?? '';
      const isPublic = PUBLIC_API_PATHS.some((p) => url.endsWith(p));
      if (!isPublic) {
        globalThis.location.href = '/login';
        return Promise.reject(new Error('No auth token — redirecting to login'));
      }
    }
  }
  return config;
});

api.interceptors.response.use(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (response): any => response.data,
  (error) => {
    if (error.response?.status === 401 && globalThis.window !== undefined) {
      clearAuth();
      globalThis.location.href = '/login';
    }
    if (error.response?.status === 403 && globalThis.window !== undefined) {
      const errorType = (error.response?.data as { error_type?: string })?.error_type;
      if (TENANT_ERROR_TYPES.has(errorType ?? '')) {
        // Tenant issue — clear session so user can log in with different credentials
        clearAuth();
        globalThis.location.href = '/login';
      } else {
        globalThis.location.href = isLoggedIn() ? '/forbidden' : '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
