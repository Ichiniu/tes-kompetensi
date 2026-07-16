<template>
  <NuxtLayout name="default">
    <div class="row g-3">
      <div class="col-lg-8 mx-auto">
        <form @submit.prevent="handleSave" class="card">
          <div class="card-header">
            <h3 class="card-title">My Profile</h3>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Username / Identifier</label>
                <input :value="profile.identifier" type="text" class="form-control" readonly />
              </div>
              <div class="col-md-6">
                <label class="form-label">Role</label>
                <input :value="profile.role" type="text" class="form-control" readonly />
              </div>

              <div class="col-12"><hr class="my-1" /></div>

              <!-- Editable fields -->
              <div class="col-md-6">
                <label class="form-label">Nama Pegawai</label>
                <input v-model="form.nama_pegawai" type="text" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Email</label>
                <input v-model="form.email" type="email" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">No. HP</label>
                <input v-model="form.no_hp" @focus="onFocusHp" @blur="onBlurHp" type="text" class="form-control" placeholder="+62..." maxlength="14" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Alamat</label>
                <input v-model="form.alamat_lengkap" type="text" class="form-control" />
              </div>

              <div class="col-12"><hr class="my-1" /></div>

              <div class="col-md-6">
                <label class="form-label">Password Baru</label>
                <input v-model="form.password" type="password" class="form-control" placeholder="Kosongkan jika tidak ingin ganti" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Konfirmasi Password</label>
                <input v-model="form.password_confirm" type="password" class="form-control" />
              </div>
              <div v-if="form.password && form.password !== form.password_confirm" class="col-12">
                <div class="alert alert-danger py-2">Password dan konfirmasi tidak sama</div>
              </div>
            </div>
          </div>
          <div class="card-footer d-flex">
            <button type="submit" class="btn btn-primary ms-auto" :disabled="saving || (form.password.length > 0 && form.password !== form.password_confirm)">
              {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApi } from '~/composables/useApi';
import { useAuthStore } from '~/stores/useAuthStore';

definePageMeta({ title: "My Profile", layout: false });
useSeoMeta({ title: "My Profile" });

const authStore = useAuthStore();
const saving = ref(false);

const profile = ref({
  identifier: '',
  role: ''
});

const form = ref({
  nama_pegawai: '',
  email: '',
  no_hp: '',
  alamat_lengkap: '',
  password: '',
  password_confirm: ''
});

const onFocusHp = () => {
  if (!form.value.no_hp || form.value.no_hp === '') {
    form.value.no_hp = '+62';
  }
};

const onBlurHp = () => {
  if (form.value.no_hp === '+62' || form.value.no_hp === '+6') {
    form.value.no_hp = '';
  }
};

onMounted(async () => {
  try {
    const res = await useApi('/auth/me');
    profile.value.identifier = res.identifier || '';
    profile.value.role = res.role || '';
    form.value.nama_pegawai = res.nama_pegawai || '';
    form.value.email = res.email || '';
    form.value.no_hp = res.no_hp || '';
    form.value.alamat_lengkap = res.alamat_lengkap || '';
  } catch (e) {
    console.error(e);
  }
});

const handleSave = async () => {
  if (form.value.email && !form.value.email.endsWith('@gmail.com')) {
    alert("Email wajib menggunakan @gmail.com!");
    return;
  }
  if (form.value.no_hp && !/^\+62\d{1,11}$/.test(form.value.no_hp)) {
    alert("Nomor HP tidak valid. Wajib diawali +62 dan maksimal 13 digit angka.");
    return;
  }
  if (form.value.password && form.value.password !== form.value.password_confirm) return;
  saving.value = true;
  try {
    const payload = {
      nama_pegawai: form.value.nama_pegawai,
      email: form.value.email,
      no_hp: form.value.no_hp,
      alamat_lengkap: form.value.alamat_lengkap
    };
    if (form.value.password) payload.password = form.value.password;

    await useApi('/auth/me', { method: 'PUT', body: payload });
    alert('Profil berhasil diperbarui');
    form.value.password = '';
    form.value.password_confirm = '';
  } catch (e) {
    alert(e.data?.message || 'Gagal menyimpan');
  } finally {
    saving.value = false;
  }
};
</script>
