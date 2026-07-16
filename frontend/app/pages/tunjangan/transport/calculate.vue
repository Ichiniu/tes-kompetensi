<template>
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">Kalkulasi Tunjangan Transport</h3>
    </div>
    <div class="card-body">
      <form @submit.prevent="handleCalculate">
        <div class="row mb-3">
          <div class="col-md-6">
            <label class="form-label">Bulan</label>
            <select v-model="form.bulan" class="form-select" required>
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Tahun</label>
            <input v-model.number="form.tahun" type="number" class="form-control" required min="2000" />
          </div>
        </div>

        <h4>Data Hari Kerja Pegawai</h4>
        <p v-if="loadingPegawai" class="text-secondary">Memuat data pegawai eligible...</p>
        <div class="table-responsive mb-3">
          <table class="table table-vcenter">
            <thead>
              <tr>
                <th style="width:5%">No</th>
                <th>Pegawai</th>
                <th style="width:15%">Jarak (KM)</th>
                <th style="width:15%">Hari Kerja Aktual</th>
                <th style="width:10%">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in form.data_hari_kerja" :key="index">
                <td class="text-center">{{ index + 1 }}</td>
                <td>{{ getPegawaiLabel(item.id_pegawai) }}</td>
                <td class="text-center">{{ getPegawaiKm(item.id_pegawai) }}</td>
                <td>
                  <input v-model.number="item.hari_kerja" type="number" class="form-control form-control-sm" :class="{ 'is-invalid': item.hari_kerja > 26 }" required min="0" max="26" />
                  <div class="invalid-feedback" v-if="item.hari_kerja > 26">Maksimal 26 hari.</div>
                </td>
                <td>
                  <button type="button" class="btn btn-danger btn-sm" @click="removeRow(index)">Hapus</button>
                </td>
              </tr>
              <tr v-if="form.data_hari_kerja.length === 0">
                <td colspan="5" class="text-center text-secondary">Belum ada data pegawai</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Fallback: tambah manual -->
        <div class="row mb-3 align-items-end">
          <div class="col-md-6">
            <label class="form-label text-secondary" style="font-size: 0.85rem">Tambah pegawai manual (jika belum ter-include otomatis)</label>
            <select v-model="manualPegawaiId" class="form-select form-select-sm">
              <option disabled value="">Pilih Pegawai...</option>
              <option v-for="p in availablePegawai" :key="p.id" :value="p.id">
                {{ p.nip }} - {{ p.nama_pegawai }}
              </option>
            </select>
          </div>
          <div class="col-md-2">
            <button type="button" class="btn btn-secondary btn-sm" @click="addManualRow">Tambah Baris</button>
          </div>
        </div>

        <div v-if="errorMsg" class="alert alert-danger">{{ errorMsg }}</div>
        <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

        <div class="d-flex justify-content-end gap-2">
          <NuxtLink to="/tunjangan/transport" class="btn btn-light">Kembali</NuxtLink>
          <button type="submit" class="btn btn-primary" :disabled="loading || form.data_hari_kerja.length === 0">
            {{ loading ? 'Menghitung...' : 'Hitung Tunjangan' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useApi } from '~/composables/useApi';
import { useRouter } from '#app';

definePageMeta({ title: "Kalkulasi Tunjangan Transport" });
useSeoMeta({ title: "Kalkulasi Tunjangan Transport" });

const router = useRouter();

const form = ref({
  bulan: new Date().getMonth() + 1,
  tahun: new Date().getFullYear(),
  data_hari_kerja: []
});

const allPegawai = ref([]);
const loadingPegawai = ref(true);
const loading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');
const manualPegawaiId = ref('');

// Load all PKWTT + Aktif employees and auto-populate rows
const loadEligiblePegawai = async () => {
  loadingPegawai.value = true;
  try {
    const res = await useApi('/pegawai?limit=200&status_kontrak=PKWTT');
    allPegawai.value = res.data || [];

    // Auto-populate rows for all eligible pegawai
    form.value.data_hari_kerja = allPegawai.value.map(p => ({
      id_pegawai: p.id,
      hari_kerja: 0
    }));
  } catch (e) {
    console.error(e);
  } finally {
    loadingPegawai.value = false;
  }
};

onMounted(() => {
  loadEligiblePegawai();
});

// Pegawai yang belum ada di tabel (untuk dropdown manual)
const availablePegawai = computed(() => {
  const usedIds = form.value.data_hari_kerja.map(d => d.id_pegawai);
  return allPegawai.value.filter(p => !usedIds.includes(p.id));
});

const getPegawaiLabel = (id) => {
  const p = allPegawai.value.find(x => x.id === id);
  return p ? `${p.nip} - ${p.nama_pegawai}` : `ID: ${id}`;
};

const getPegawaiKm = (id) => {
  const p = allPegawai.value.find(x => x.id === id);
  return p ? (p.jarak_rumah_kantor || 0) : '-';
};

const addManualRow = () => {
  if (!manualPegawaiId.value) return;
  form.value.data_hari_kerja.push({ id_pegawai: manualPegawaiId.value, hari_kerja: 0 });
  manualPegawaiId.value = '';
};

const removeRow = (index) => {
  form.value.data_hari_kerja.splice(index, 1);
};

const handleCalculate = async () => {
  loading.value = true;
  errorMsg.value = '';
  successMsg.value = '';

  try {
    const res = await useApi('/tunjangan/calculate', {
      method: 'POST',
      body: form.value
    });

    successMsg.value = `Kalkulasi berhasil: ${res.total_penerima} pegawai menerima tunjangan.`;
    setTimeout(() => {
      router.push('/tunjangan/transport');
    }, 2000);
  } catch (err) {
    errorMsg.value = err.data?.message || 'Terjadi kesalahan saat kalkulasi';
  } finally {
    loading.value = false;
  }
};
</script>
