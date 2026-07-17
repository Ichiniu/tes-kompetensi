import { useRuntimeConfig, useRequestHeaders } from '#app';
import { useAuthStore } from '../stores/useAuthStore';

// Simpan CSRF token di module-level (memory), bukan localStorage
let csrfToken = '';

export const setCsrfToken = (token) => {
  csrfToken = token;
};

export const useApi = async (url, options = {}) => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const isServer = process.server;
  const baseURL = isServer 
    ? (config.apiBaseUrlServer || 'http://backend:3001/api') 
    : config.public.apiBaseUrl;

  const headers = {
    'Accept': 'application/json',
  };

  // Teruskan cookies klien ke backend API selama SSR
  if (isServer) {
    const clientHeaders = useRequestHeaders(['cookie']);
    if (clientHeaders.cookie) {
      headers['cookie'] = clientHeaders.cookie;
    }
  }

  const defaults = {
    baseURL,
    credentials: 'include', // Sertakan cookies (JWT) di setiap request
    headers,
    async onRequest({ options: reqOptions }) {
      if (process.client) {
        authStore.updateActivity();
      }

      // Kirim CSRF token untuk semua state-changing methods
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(reqOptions.method?.toUpperCase())) {
        if (csrfToken) {
          reqOptions.headers = new Headers(reqOptions.headers || {});
          reqOptions.headers.set('X-XSRF-TOKEN', csrfToken);
        }
      }
    },
    async onResponseError({ response }) {
      if (response.status === 401) {
        authStore.clearUser();
        if (process.client) {
          window.location.href = '/Login';
        }
      }
    }
  };

  const finalOptions = { ...defaults, ...options };
  finalOptions.headers = { ...defaults.headers, ...(options.headers || {}) };

  return $fetch(url, finalOptions);
};
