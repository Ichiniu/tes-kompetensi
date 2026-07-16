import { useRuntimeConfig } from '#app';
import { useAuthStore } from '../stores/useAuthStore';

// Simpan CSRF token di module-level (memory), bukan localStorage
let csrfToken = '';

export const setCsrfToken = (token) => {
  csrfToken = token;
};

export const useApi = async (url, options = {}) => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const defaults = {
    baseURL: config.public.apiBaseUrl,
    credentials: 'include', // Sertakan cookies (JWT) di setiap request
    headers: {
      'Accept': 'application/json',
    },
    async onRequest({ options: reqOptions }) {
      authStore.updateActivity();

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
