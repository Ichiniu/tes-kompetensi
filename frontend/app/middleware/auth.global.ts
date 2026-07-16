import { useAuthStore } from '~/stores/useAuthStore';
import { useApi, setCsrfToken } from '~/composables/useApi';

export default defineNuxtRouteMiddleware(async (to) => {
  // Izinkan akses ke halaman Login tanpa auth
  const publicRoutes = ['/Login', '/login'];
  if (publicRoutes.includes(to.path)) return;

  const authStore = useAuthStore();

  // Kalau belum ada user di store, coba fetch dari /auth/me (cookie masih aktif)
  if (!authStore.user) {
    try {
      const me = await useApi('/auth/me');
      if (me && me.id) {
        authStore.setUser({
          id: me.id,
          username: me.identifier,
          role: me.role,
          id_role: me.id_role,
          id_pegawai: me.id_pegawai
        });
        
        // Restore CSRF token
        try {
          const csrf = await useApi('/auth/csrf');
          if (csrf && csrf.token) {
            setCsrfToken(csrf.token);
          }
        } catch (e) {
          console.error('Failed to fetch CSRF on restore', e);
        }
      } else {
        return navigateTo('/Login');
      }
    } catch {
      // Token tidak valid / tidak ada cookie → redirect ke login
      return navigateTo('/Login');
    }
  }
});
