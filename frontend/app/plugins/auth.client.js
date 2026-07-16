import { useAuthStore } from '../stores/useAuthStore';
import { useApi } from '../composables/useApi';

export default defineNuxtPlugin((nuxtApp) => {
  const authStore = useAuthStore();
  let logoutTimer = null;
  let rememberMe = false;

  const startLogoutTimer = () => {
    if (rememberMe) return; // Do not auto-logout if remember me is true
    
    if (logoutTimer) clearTimeout(logoutTimer);
    
    logoutTimer = setTimeout(async () => {
      // 3 minutes idle timeout
      const now = Date.now();
      if (now - authStore.lastActivity >= 3 * 60 * 1000) {
        try {
          await useApi('/auth/logout', { method: 'POST' });
        } catch (e) {}
        authStore.clearUser();
        window.location.href = '/Login';
      }
    }, 3 * 60 * 1000); // Check every 3 minutes
  };

  const resetTimer = () => {
    if (authStore.user) {
      authStore.updateActivity();
      startLogoutTimer();
    }
  };

  nuxtApp.provide('setRememberMe', (val) => {
    rememberMe = val;
    if (val && logoutTimer) {
      clearTimeout(logoutTimer);
    }
  });

  if (process.client) {
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);
  }
});
