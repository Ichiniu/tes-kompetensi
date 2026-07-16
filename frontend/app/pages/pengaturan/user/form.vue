<template>
  <NuxtLayout name="default">
    <div class="row g-3">
      <div class="col-lg-6 mx-auto">
        <form @submit.prevent="handleSubmit" class="card">
          <div class="card-header">
            <h3 class="card-title">{{ isEdit ? 'Edit User' : 'Tambah User' }}</h3>
          </div>
          <div class="card-body">

            <!-- Nama Pegawai (Autosuggest) -->
            <div class="mb-3">
              <label class="form-label required">Nama Pengguna</label>
              <div class="position-relative">
                <input
                  v-model="pegawaiSearch"
                  @input="onPegawaiInput"
                  @blur="hideSuggestionDelay"
                  type="text"
                  class="form-control"
                  placeholder="Cari nama pegawai..."
                  autocomplete="off"
                />
                <!-- Dropdown autosuggest -->
                <ul v-if="showSuggestions && pegawaiSuggestions.length" class="list-group position-absolute w-100 shadow bg-white" style="z-index:999; max-height:200px; overflow-y:auto; top: 100%; margin-top: 4px;">
                <li
                  v-for="p in pegawaiSuggestions"
                  :key="p.id"
                  class="list-group-item list-group-item-action cursor-pointer"
                  @mousedown.prevent="selectPegawai(p)"
                >
                  <strong>{{ p.nip }}</strong> — {{ p.nama_pegawai }}
                </li>
                </ul>
              </div>
              <div v-if="form.id_pegawai" class="form-text text-success">
                ✓ Terhubung ke pegawai ID {{ form.id_pegawai }}
              </div>
              <div v-if="pegawaiSearch.length >= 1 && pegawaiSearch.length < 2" class="form-text text-muted">
                Ketik minimal 2 karakter
              </div>
            </div>

            <!-- Username / Identifier -->
            <div class="mb-3">
              <label class="form-label required">Username</label>
              <input
                v-model="form.identifier"
                @input="validateIdentifier"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': identifierError, 'is-valid': identifierValid }"
                placeholder="Min 6 karakter, huruf kecil & angka"
                required
              />
              <div v-if="identifierError" class="invalid-feedback">{{ identifierError }}</div>
            </div>

            <!-- Password + Auto-Generate -->
            <div class="mb-3">
              <label class="form-label" :class="{ required: !isEdit }">Password</label>
              <div class="input-group">
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-control"
                  :placeholder="isEdit ? 'Kosongkan jika tidak ingin mengubah' : 'Min. 8 karakter'"
                  :required="!isEdit"
                />
                <button type="button" class="btn btn-outline-secondary" @click="showPassword = !showPassword">
                  {{ showPassword ? 'Sembunyikan' : 'Tampilkan' }}
                </button>
                <button type="button" class="btn btn-outline-primary" @click="generatePassword" title="Generate password otomatis">
                  Generate
                </button>
              </div>
              <div v-if="form.password" class="form-text" :class="passwordStrengthClass">
                {{ passwordStrengthText }}
              </div>
            </div>

            <!-- Role -->
            <div class="mb-3">
              <label class="form-label required">Role</label>
              <select v-model="form.id_role" class="form-select" required>
                <option value="" disabled>Pilih Role</option>
                <option v-for="r in listRole" :key="r.id" :value="r.id">{{ r.nama_role }}</option>
              </select>
            </div>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label required">Jabatan</label>
                <select v-model="form.id_jabatan" class="form-select" disabled>
                  <option value="" disabled>Pilih Jabatan (dari data Pegawai)</option>
                  <option v-for="j in masterJabatan" :key="j.id" :value="j.id">{{ j.nama }}</option>
                </select>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label required">Departemen</label>
                <select v-model="form.id_departemen" class="form-select" disabled>
                  <option value="" disabled>Pilih Departemen (dari data Pegawai)</option>
                  <option v-for="d in masterDepartemen" :key="d.id" :value="d.id">{{ d.nama }}</option>
                </select>
              </div>
            </div>

            <!-- Status -->
            <div class="mb-3">
              <label class="form-label">Status</label>
              <div class="form-check form-switch mt-1">
                <input v-model="form.statusAktif" class="form-check-input" type="checkbox" role="switch" id="switchStatus" />
                <label class="form-check-label" for="switchStatus">
                  {{ form.statusAktif ? 'Aktif' : 'Nonaktif' }}
                </label>
              </div>
            </div>

          </div>
          <div class="card-footer d-flex">
            <button type="button" class="btn btn-link" @click="router.push('/pengaturan/user')">Batal</button>
            <button type="submit" class="btn btn-primary ms-auto" :disabled="loading || !!identifierError">
              {{ loading ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from '#app';
import { useApi } from '~/composables/useApi';

definePageMeta({ title: "Form User", layout: false });
useSeoMeta({ title: "Form User" });

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const isEdit = ref(false);
const showPassword = ref(false);

const form = ref({
  identifier: '',
  password: '',
  id_pegawai: null,
  id_role: '',
  id_jabatan: '',
  id_departemen: '',
  statusAktif: true
});

// Autosuggest
const pegawaiSearch = ref('');
const pegawaiSuggestions = ref([]);
const showSuggestions = ref(false);
let suggestTimeout = null;

const onPegawaiInput = () => {
  form.value.id_pegawai = null;
  if (pegawaiSearch.value.length < 2) {
    pegawaiSuggestions.value = [];
    showSuggestions.value = false;
    return;
  }
  clearTimeout(suggestTimeout);
  suggestTimeout = setTimeout(async () => {
    try {
      const res = await useApi(`/pegawai/autosuggest?q=${encodeURIComponent(pegawaiSearch.value)}`);
      pegawaiSuggestions.value = res;
      showSuggestions.value = true;
    } catch (e) {}
  }, 300);
};

const selectPegawai = (p) => {
  pegawaiSearch.value = `${p.nip} — ${p.nama_pegawai}`;
  form.value.id_pegawai = p.id;
  form.value.id_jabatan = p.id_jabatan || '';
  form.value.id_departemen = p.id_departemen || '';
  showSuggestions.value = false;
  // Auto-fill identifier from nip if empty
  if (!form.value.identifier && !isEdit.value) {
    form.value.identifier = p.nip.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
};

const hideSuggestionDelay = () => {
  setTimeout(() => { showSuggestions.value = false; }, 200);
};

// Identifier validation onkeyup
const identifierError = ref('');
const identifierValid = ref(false);

const validateIdentifier = () => {
  let val = form.value.identifier;
  if (!val) { identifierError.value = ''; identifierValid.value = false; return; }
  
  // Paksa lowercase dan hapus spasi otomatis
  val = val.toLowerCase().replace(/\s/g, '');
  form.value.identifier = val;

  if (val.length < 6) {
    identifierError.value = 'Minimal 6 karakter';
    identifierValid.value = false;
  } else if (!/^[a-z0-9]+$/.test(val)) {
    identifierError.value = 'Hanya boleh huruf kecil dan angka';
    identifierValid.value = false;
  } else if (!/[0-9]/.test(val)) {
    identifierError.value = 'Harus mengandung minimal 1 angka';
    identifierValid.value = false;
  } else {
    identifierError.value = '';
    identifierValid.value = true;
  }
};

// Auto-generate password
const generatePassword = () => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=';
  const all = upper + lower + numbers + special;
  let pwd = '';
  // Ensure at least one of each required type
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += numbers[Math.floor(Math.random() * numbers.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  // Fill remaining up to 12 chars
  for (let i = 4; i < 12; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  // Shuffle
  form.value.password = pwd.split('').sort(() => Math.random() - 0.5).join('');
  showPassword.value = true;
};

// Password strength
const passwordStrengthClass = computed(() => {
  const p = form.value.password;
  if (!p) return '';
  if (p.length < 6) return 'text-danger';
  if (p.length < 8) return 'text-warning';
  if (/[A-Z]/.test(p) && /[0-9]/.test(p) && /[^a-zA-Z0-9]/.test(p)) return 'text-success';
  return 'text-warning';
});

const passwordStrengthText = computed(() => {
  const p = form.value.password;
  if (!p) return '';
  if (p.length < 6) return '⚠ Terlalu pendek';
  if (p.length < 8) return '⚠ Lemah — min. 8 karakter';
  if (/[A-Z]/.test(p) && /[0-9]/.test(p) && /[^a-zA-Z0-9]/.test(p)) return '✓ Kuat';
  return '⚠ Sedang — tambahkan huruf kapital, angka, dan karakter khusus';
});

const listRole = ref([]);
const masterJabatan = ref([]);
const masterDepartemen = ref([]);

const fetchData = async () => {
  try {
    listRole.value = await useApi('/role');
    const id = route.query.id;
    if (id) {
      isEdit.value = true;
      const user = await useApi(`/user/${id}`);
      form.value.identifier = user.identifier;
      form.value.id_role = user.id_role || '';
      form.value.statusAktif = user.status === 'aktif';
      if (user.id_pegawai) {
        form.value.id_pegawai = user.id_pegawai;
        // Try to fill label
        const peg = await useApi(`/pegawai/${user.id_pegawai}`);
        if (peg) {
          pegawaiSearch.value = `${peg.nip} — ${peg.nama_pegawai}`;
          form.value.id_jabatan = peg.id_jabatan || '';
          form.value.id_departemen = peg.id_departemen || '';
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
};

const handleSubmit = async () => {
  validateIdentifier();
  if (identifierError.value) return;

  loading.value = true;
  try {
    const url = isEdit.value ? `/user/${route.query.id}` : '/user';
    const method = isEdit.value ? 'PUT' : 'POST';

    const payload = {
      identifier: form.value.identifier,
      id_pegawai: form.value.id_pegawai || null,
      id_role: form.value.id_role,
      status: form.value.statusAktif ? 'aktif' : 'nonaktif'
    };
    if (form.value.password) payload.password = form.value.password;

    await useApi(url, { method, body: payload });
    router.push('/pengaturan/user');
  } catch (err) {
    alert(err.data?.message || 'Gagal menyimpan data');
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    const md = await useApi('/master');
    masterJabatan.value = md.filter(m => m.tipe === 'jabatan');
    masterDepartemen.value = md.filter(m => m.tipe === 'departemen');
  } catch (e) {}
  fetchData();
});
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }
</style>
