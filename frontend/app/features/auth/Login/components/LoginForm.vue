<template>
  <form @submit.prevent="handleLogin">
    <!-- Username -->
    <div class="mb-2">
      <input
        v-model="form.identifier"
        type="text"
        class="form-control py-3 border-0 bg-light text-dark"
        placeholder="Username / Email / NIP"
        required
      />
    </div>

    <!-- Password -->
    <div class="mb-2">
      <input
        v-model="form.password"
        type="password"
        class="form-control py-3 border-0 bg-light text-dark"
        placeholder="Password"
        required
      />
    </div>

    <!-- Captcha -->
    <div class="mb-2" v-if="captcha.question">
      <div class="d-flex align-items-center mb-2">
        <div class="form-control py-2 bg-light text-dark fw-bold text-center" style="width: fit-content; min-width: 150px; font-size: 1.25rem; letter-spacing: 5px;">
          {{ captcha.question }}
        </div>
        <button type="button" class="btn btn-sm btn-link ms-2" @click="fetchCaptcha">Refresh</button>
      </div>
      <input
        v-model="form.captchaAnswer"
        type="text"
        class="form-control py-3 border-0 bg-light text-dark"
        placeholder="Ketik kode captcha di atas"
        required
      />
    </div>

    <!-- Remember Me -->
    <div class="mb-2">
      <label class="form-check">
        <input v-model="form.rememberMe" type="checkbox" class="form-check-input" />
        <span class="form-check-label">Remember Me</span>
      </label>
    </div>

    <div v-if="errorMsg" class="alert alert-danger">{{ errorMsg }}</div>

    <!-- Submit -->
    <div class="d-grid mt-4">
      <button :disabled="loading" class="btn btn-primary text-uppercase shadow py-3" type="submit">
        {{ loading ? 'Loading...' : 'Masuk' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '~/stores/useAuthStore';
import { useApi, setCsrfToken } from '~/composables/useApi';
import { useRouter, useNuxtApp } from '#app';

const router = useRouter();
const authStore = useAuthStore();
const nuxtApp = useNuxtApp();

const form = ref({
  identifier: '',
  password: '',
  captchaAnswer: '',
  rememberMe: false
});

const captcha = ref({
  id: '',
  question: ''
});

const loading = ref(false);
const errorMsg = ref('');

const fetchCaptcha = async () => {
  try {
    const res = await useApi('/auth/captcha');
    captcha.value.id = res.captchaId;
    captcha.value.question = res.question;
  } catch (err) {
    console.error('Failed to load captcha');
  }
};

const fetchCsrf = async () => {
  try {
    const res = await useApi('/csrf');
    // Simpan token dari response body ke memori
    if (res?.token) {
      setCsrfToken(res.token);
    }
  } catch (err) {
    console.error('Failed to init CSRF');
  }
};

onMounted(async () => {
  if (process.client) {
    const savedUser = localStorage.getItem('remembered_user');
    if (savedUser) {
      form.value.identifier = savedUser;
      form.value.rememberMe = true;
    }
  }
  await fetchCsrf();
  await fetchCaptcha();
});

const handleLogin = async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    const payload = {
      identifier: form.value.identifier,
      password: form.value.password,
      captchaId: captcha.value.id,
      captchaAnswer: form.value.captchaAnswer,
      rememberMe: form.value.rememberMe
    };
    
    const res = await useApi('/auth/login', {
      method: 'POST',
      body: payload
    });

    if (res.user) {
      // Fetch full user info termasuk nama_role untuk keperluan dashboard per-role
      try {
        const meRes = await useApi('/auth/me');
        authStore.setUser({
          ...res.user,
          username: meRes.identifier,
          role: meRes.role,
          id_pegawai: meRes.id_pegawai
        });
      } catch (e) {
        authStore.setUser(res.user);
      }

      if (process.client) {
        if (form.value.rememberMe) {
          localStorage.setItem('remembered_user', form.value.identifier);
        } else {
          localStorage.removeItem('remembered_user');
        }
      }

      if (nuxtApp.$setRememberMe) {
        nuxtApp.$setRememberMe(form.value.rememberMe);
      }
      router.push('/');
    }
  } catch (err) {
    errorMsg.value = err.data?.message || 'Login failed';
    fetchCaptcha(); // Refresh captcha on failure
    form.value.captchaAnswer = '';
  } finally {
    loading.value = false;
  }
};
</script>

