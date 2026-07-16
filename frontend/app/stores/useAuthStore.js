import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    lastActivity: Date.now()
  }),
  actions: {
    setUser(userData) {
      this.user = userData;
      this.lastActivity = Date.now();
    },
    clearUser() {
      this.user = null;
    },
    updateActivity() {
      this.lastActivity = Date.now();
    }
  }
});
