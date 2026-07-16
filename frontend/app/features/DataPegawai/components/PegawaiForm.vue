<template>
  <form @submit.prevent="handleSubmit" class="row g-3">
    <div class="col-lg-6">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Data Diri</h3>
        </div>
        <div class="card-body">
          <div class="row g-4">
            <div class="col-12">
              <div class="row align-items-center">
                <!-- Foto -->
                <div class="col-auto text-center">
                  <img
                    :src="fotoPreview || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iYmxhY2siPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEyIiAvPjxwYXRoIGZpbGw9IndoaXRlIiBkPSJNMTIgMTJjMi4yMSAwIDQtMS43OSA0LTRzLTEuNzktNC00LTQtNCAxLjc5LTQgNCAxLjc5IDQgNCA0em0wIDJjLTIuNjcgMC04IDEuMzQtOCA0djJoMTZ2LTJjMC0yLjY2LTUuMzMtNC04LTR6Ii8+PC9zdmc+'"
                    alt="Foto Pegawai"
                    class="foto-profil mb-2 rounded-circle"
                    style="width: 120px; height: 120px; object-fit: cover; border: 2px solid #E5E5E8; padding: 2px; background-color: #f7f7f8;"
                  />
                  <br />
                  <label for="unggah-foto" class="btn btn-sm btn-outline-primary cursor-pointer">Pilih Foto</label>
                  <input id="unggah-foto" type="file" @change="handleFileUpload" hidden accept="image/png, image/jpeg, image/jpg" />
                  <div class="text-muted text-xs mt-1">PNG/JPG/JPEG Max 1MB</div>
                </div>

                <div class="col">
                  <!-- NIP -->
                  <div class="mb-3">
                    <label class="form-label required">NIP</label>
                    <input v-model="form.nip" type="text" class="form-control" @keypress="onlyNumbers" minlength="8" maxlength="30" required placeholder="Minimal 8 digit angka" />
                  </div>

                  <!-- Nama Lengkap -->
                  <div>
                    <label class="form-label required">Nama Lengkap</label>
                    <input v-model="form.nama_pegawai" type="text" class="form-control" @input="filterNama" required placeholder="Hanya huruf, angka, spasi, petik" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Email -->
            <div class="col-md-6">
              <label class="form-label required">Email</label>
              <input v-model="form.email" @input="filterEmail" type="email" class="form-control" placeholder="wajib @gmail.com" required />
            </div>

            <!-- No HP -->
            <div class="col-md-6">
              <label class="form-label required">Nomor HP</label>
              <input v-model="form.nomor_hp" @focus="onFocusHp" @blur="onBlurHp" type="text" class="form-control" maxlength="14" placeholder="+62..." required />
              <small v-if="hpError" class="text-danger">{{ hpError }}</small>
            </div>

            <!-- Tempat Lahir -->
            <div class="col-md-5">
              <label class="form-label required">Tempat Lahir</label>
              <input v-model="form.tempat_lahir" type="text" class="form-control" required />
            </div>

            <!-- Tanggal Lahir -->
            <div class="col-md-5">
              <label class="form-label required">Tanggal Lahir</label>
              <input v-model="form.tanggal_lahir" type="date" class="form-control" :max="maxDateOfBirth" required />
            </div>

            <!-- Usia -->
            <div class="col-md-2">
              <label class="form-label">Usia</label>
              <input :value="calculatedAge" type="text" class="form-control" disabled />
            </div>

            <!-- Jenis Kelamin -->
            <div class="col-md-12">
              <label class="form-label required">Jenis Kelamin</label>
              <select v-model="form.jenis_kelamin" class="form-select" required>
                <option value="" disabled>-- Pilih Jenis Kelamin --</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            
            <!-- Status Pernikahan -->
            <div class="col-md-6">
              <div class="form-label required">Status Pernikahan</div>
              <div>
                <label class="form-check form-check-inline">
                  <input v-model="form.status_kawin" value="kawin" class="form-check-input" type="radio" required />
                  <span class="form-check-label">Kawin</span>
                </label>
                <label class="form-check form-check-inline">
                  <input v-model="form.status_kawin" value="tidak kawin" class="form-check-input" type="radio" required />
                  <span class="form-check-label">Tidak Kawin</span>
                </label>
              </div>
            </div>

            <!-- Jumlah Anak -->
            <div class="col-md-6">
              <label class="form-label required">Jumlah Anak</label>
              <input v-model="form.jumlah_anak" @keypress="onlyNumbers" maxlength="2" type="text" class="form-control" required />
            </div>

            <!-- Kecamatan -->
            <div class="col-12 position-relative">
              <label class="form-label required">Alamat - Kecamatan</label>
              <input v-model="searchKecamatan" @input="handleSearchKecamatan" @blur="onBlurKecamatan" @focus="handleSearchKecamatan" type="text" class="form-control" placeholder="Ketik minimal 3 huruf..." autocomplete="off" required />
              <div v-if="showDropdownKecamatan && listKecamatan.length > 0" class="dropdown-menu show w-100 position-absolute shadow" style="max-height: 200px; overflow-y: auto; z-index: 1000; top: 100%;">
                <button v-for="w in listKecamatan" :key="w.id" type="button" class="dropdown-item" @mousedown.prevent="selectKecamatan(w)">
                  {{ w.kecamatan }} - {{ w.kabupaten }}, {{ w.provinsi }}
                </button>
              </div>
              <div v-if="showDropdownKecamatan && listKecamatan.length === 0 && searchKecamatan.length >= 3" class="dropdown-menu show w-100 position-absolute p-2 text-muted shadow" style="top: 100%; z-index: 1000;">
                Kecamatan tidak ditemukan
              </div>
            </div>

            <!-- Kabupaten -->
            <div class="col-md-6">
              <label class="form-label required">Alamat - Kabupaten</label>
              <input type="text" :value="autoKabupaten" class="form-control" disabled />
            </div>

            <!-- Provinsi -->
            <div class="col-md-6">
              <label class="form-label required">Alamat - Provinsi</label>
              <input type="text" :value="autoProvinsi" class="form-control" disabled />
            </div>
            
            <!-- Alamat Lengkap -->
            <div class="col-12">
              <label class="form-label required">Alamat - Lengkap</label>
              <textarea v-model="form.alamat_lengkap" class="form-control" rows="3" required></textarea>
            </div>

            <!-- Jarak Rumah Kantor -->
            <div class="col-md-6">
              <label class="form-label required">Jarak Rumah - Kantor (KM)</label>
              <input v-model="form.jarak_rumah_kantor" @keypress="onlyNumbers" maxlength="2" type="text" class="form-control" required />
            </div>
            
          </div>
        </div>
      </div>
    </div>
    <div class="col-lg-6">
      <div class="card mb-3">
        <div class="card-header">
          <h3 class="card-title">Data Kepegawaian</h3>
        </div>
        <div class="card-body">
          <div class="row g-4">
            <!-- Tanggal Masuk -->
            <div class="col-md-6">
              <label class="form-label required">Tanggal Masuk</label>
              <input v-model="form.tanggal_masuk" type="date" class="form-control" required />
            </div>
            
            <!-- Status Karyawan -->
            <div class="col-md-6">
              <label class="form-label required">Status Karyawan</label>
              <select v-model="form.status" class="form-select" required>
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>

            <!-- Jabatan -->
            <div class="col-md-4">
              <label class="form-label required">Jabatan</label>
              <select v-model="form.id_jabatan" class="form-select" required>
                <option value="" disabled>Pilih Jabatan</option>
                <option v-for="j in masterJabatan" :key="j.id" :value="j.id">{{ j.nama }}</option>
              </select>
            </div>

            <!-- Departemen -->
            <div class="col-md-4">
              <label class="form-label required">Departemen</label>
              <select v-model="form.id_departemen" class="form-select" required>
                <option value="" disabled>Pilih Departemen</option>
                <option v-for="d in masterDepartemen" :key="d.id" :value="d.id">{{ d.nama }}</option>
              </select>
            </div>

            <!-- Status Kontrak -->
            <div class="col-md-4">
              <label class="form-label required">Status Kontrak</label>
              <select v-model="form.status_kontrak" class="form-select" required>
                <option value="PKWTT">PKWTT</option>
                <option value="PKWT">PKWT</option>
                <option value="Magang">Magang</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Pendidikan -->
      <div class="card mb-3">
        <div class="card-header">
          <h3 class="card-title required">Pendidikan</h3>
        </div>
        <div class="card-body p-0">
          <table class="table table-borderless align-middle m-0">
            <thead>
              <tr>
                <th class="py-2">Jenjang</th>
                <th class="py-2">Nama Sekolah / Perguruan Tinggi</th>
                <th class="py-2">Tahun Lulus</th>
                <th class="py-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(edu, i) in form.pendidikan" :key="i">
                <td><input v-model="edu.tingkat_pendidikan" type="text" class="form-control form-control-sm" required placeholder="SD/SMP/SMA" /></td>
                <td><input v-model="edu.nama_sekolah" type="text" class="form-control form-control-sm" required /></td>
                <td><input v-model="edu.tahun_lulus" type="number" class="form-control form-control-sm" required /></td>
                <td><button type="button" class="btn btn-sm btn-danger" @click="removeEdu(i)">X</button></td>
              </tr>
            </tbody>
          </table>
          <div v-if="form.pendidikan.length < 5" class="text-center p-3">
            <button type="button" class="btn btn-outline-primary btn-sm" @click="addEdu">+ Tambah Pendidikan</button>
          </div>
          <div v-else class="text-center p-3 text-muted text-sm">
            Maksimal 5 riwayat pendidikan.
          </div>
        </div>
        <div class="card-footer d-flex">
          <div class="d-flex gap-2 ms-auto">
            <button type="submit" class="btn btn-primary" :disabled="loading">{{ loading ? 'Menyimpan...' : 'Simpan Data' }}</button>
            <button type="button" class="btn btn-outline-secondary" @click="goBack()">Kembali</button>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter, useRuntimeConfig } from '#app';
import { useApi } from '~/composables/useApi';

const route = useRoute();
const router = useRouter();
const runtimeConfig = useRuntimeConfig();

const goBack = () => router.push('/pegawai');

const loading = ref(false);
const isEdit = ref(false);

const masterJabatan = ref([]);
const masterDepartemen = ref([]);
const listKecamatan = ref([]);

const searchKecamatan = ref('');
const showDropdownKecamatan = ref(false);
const autoKabupaten = ref('');
const autoProvinsi = ref('');

const fotoPreview = ref('');
const fotoFile = ref(null);

const form = ref({
  nip: '',
  nama_pegawai: '',
  email: '',
  nomor_hp: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  jenis_kelamin: '',
  status_kawin: 'tidak kawin',
  jumlah_anak: '',
  id_kecamatan: '',
  alamat_lengkap: '',
  jarak_rumah_kantor: '',
  tanggal_masuk: '',
  id_jabatan: '',
  id_departemen: '',
  status_kontrak: 'PKWTT',
  status: 'Aktif',
  pendidikan: []
});

const maxDateOfBirth = computed(() => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 20);
  return date.toISOString().split('T')[0];
});

const calculatedAge = computed(() => {
  if (!form.value.tanggal_lahir) return '';
  const birth = new Date(form.value.tanggal_lahir);
  const diff = Date.now() - birth.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
});

// Validations frontend
const onlyNumbers = (e) => {
  const charCode = (e.which) ? e.which : e.keyCode;
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    e.preventDefault();
  }
};

const filterNama = (e) => {
  // Hanya huruf, angka, spasi, dan petik atas
  form.value.nama_pegawai = e.target.value.replace(/[^a-zA-Z0-9\s']/g, '');
};

const filterEmail = () => {
  form.value.email = form.value.email.toLowerCase();
};

const hpError = ref('');
const onFocusHp = () => {
  if (!form.value.nomor_hp) {
    form.value.nomor_hp = '+62';
  }
};
const onBlurHp = () => {
  const hpRegex = /^\+62\d{1,11}$/;
  if (form.value.nomor_hp && !hpRegex.test(form.value.nomor_hp)) {
    hpError.value = 'Nomor HP harus diawali +62 dan maksimal 13 digit angka';
  } else {
    hpError.value = '';
  }
};

const addEdu = () => {form.value.pendidikan.push({ tingkat_pendidikan: '', nama_sekolah: '', tahun_lulus: new Date().getFullYear() });}
const removeEdu = (i) => form.value.pendidikan.splice(i, 1);

// Autocomplete Kecamatan Logic
let debounceTimeout = null;
const handleSearchKecamatan = () => {
  if (searchKecamatan.value.length < 3) {
    showDropdownKecamatan.value = false;
    return;
  }
  
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(async () => {
    try {
      const res = await useApi(`/master/wilayah/autocomplete?q=${searchKecamatan.value}`);
      listKecamatan.value = res;
      showDropdownKecamatan.value = true;
    } catch(e) {}
  }, 300);
};

const selectKecamatan = (wilayah) => {
  form.value.id_kecamatan = wilayah.id;
  searchKecamatan.value = wilayah.kecamatan;
  autoKabupaten.value = wilayah.kabupaten;
  autoProvinsi.value = wilayah.provinsi;
  showDropdownKecamatan.value = false;
};

const onBlurKecamatan = () => {
  // Sembunyikan dropdown dengan sedikit delay agar mousedown sempat terpanggil
  setTimeout(() => {
    showDropdownKecamatan.value = false;
  }, 200);
};

const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  if (file.size > 1 * 1024 * 1024) {
    alert("Ukuran file maksimal 1MB");
    e.target.value = '';
    return;
  }
  
  if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
    alert("Format foto harus PNG/JPEG/JPG");
    e.target.value = '';
    return;
  }
  
  fotoFile.value = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    fotoPreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

const handleSubmit = async () => {
  if (form.value.nip.length < 8) {
    alert("NIP minimal 8 karakter!");
    return;
  }
  
  if (!form.value.email.endsWith('@gmail.com')) {
    alert("Email wajib menggunakan @gmail.com!");
    return;
  }

  if (calculatedAge.value !== '' && calculatedAge.value < 20) {
    alert("Usia pegawai minimal 20 tahun!");
    return;
  }

  if (hpError.value || !/^\+62\d{1,11}$/.test(form.value.nomor_hp)) {
    alert("Nomor HP tidak valid. Wajib diawali +62 dan maksimal 13 digit angka.");
    return;
  }

  if (!form.value.id_kecamatan) {
    alert("Silakan pilih kecamatan dari dropdown!");
    return;
  }
  
  if (form.value.pendidikan.length === 0) {
    alert("Minimal harus ada 1 riwayat pendidikan!");
    return;
  }

  loading.value = true;
  try {
    const formData = new FormData();
    // Hanya kirim field yang diizinkan oleh backend Joi schema
    const allowedFields = [
      'nip', 'nama_pegawai', 'email', 'nomor_hp', 'tempat_lahir',
      'id_kecamatan', 'alamat_lengkap', 'jarak_rumah_kantor',
      'tanggal_lahir', 'jenis_kelamin', 'status_kawin', 'jumlah_anak',
      'tanggal_masuk', 'id_jabatan', 'id_departemen',
      'status_kontrak', 'status'
    ];
    allowedFields.forEach(key => {
      formData.append(key, form.value[key] !== null && form.value[key] !== undefined ? form.value[key] : '');
    });
    // Pendidikan terpisah, bersihkan dari field tambahan
    const cleanPendidikan = (form.value.pendidikan || []).map(p => ({
      tingkat_pendidikan: p.tingkat_pendidikan,
      nama_sekolah: p.nama_sekolah,
      tahun_lulus: Number(p.tahun_lulus)
    }));
    formData.append('pendidikan', JSON.stringify(cleanPendidikan));
    
    // Append foto
    if (fotoFile.value) {
      formData.append('foto', fotoFile.value);
    }
    
    // Note: useApi usually sends JSON, we might need a custom fetch if we send FormData because of boundary headers
    // but useApi composable often handles it if we don't set 'Content-Type' manually (fetch does it).
    
    const url = isEdit.value ? `/pegawai/${route.params.id}` : '/pegawai';
    const method = isEdit.value ? 'PUT' : 'POST';

    await useApi(url, {
      method,
      body: formData
    });

    router.push('/pegawai');
  } catch (err) {
    const msg = err.data?.message || err.message || 'Gagal menyimpan data';
    alert(msg);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    const md = await useApi('/master/data');
    masterJabatan.value = md.jabatan || [];
    masterDepartemen.value = md.departemen || [];
  } catch(e) {
    console.error(e);
  }
  
  const idParam = route.params.id;
  if (idParam && idParam !== 'form') {
    isEdit.value = true;
    try {
      const res = await useApi(`/pegawai/${idParam}`);
      Object.assign(form.value, res);
      
      const formatToDateString = (val) => {
        if (!val) return '';
        const d = new Date(val);
        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
      };

      form.value.tanggal_lahir = formatToDateString(res.tanggal_lahir);
      form.value.tanggal_masuk = formatToDateString(res.tanggal_masuk);
      
      if (res.id_kecamatan) {
        searchKecamatan.value = res.kecamatan;
        autoKabupaten.value = res.kabupaten;
        autoProvinsi.value = res.provinsi;
      }
      
      if (res.foto_path) {
        try {
          const apiBase = runtimeConfig.public.apiBase || 'http://localhost:3001/api';
          const token = useCookie('token').value;
          const imgResponse = await fetch(`${apiBase}/pegawai/${res.id}/foto`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (imgResponse.ok) {
            const blob = await imgResponse.blob();
            fotoPreview.value = URL.createObjectURL(blob);
          }
        } catch(e) {}
      }
    } catch (e) {
      console.error(e);
    }
  }
});
</script>

<style scoped>
.required::after {
  content: " *";
  color: red;
}
</style>
