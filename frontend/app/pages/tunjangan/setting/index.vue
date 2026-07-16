<template>
  <NuxtLayout name="default">
    <div class="row g-3">
      <div class="col-lg-6 mx-auto">
        <form @submit.prevent="handleSave" class="card">
          <div class="card-header">
            <h3 class="card-title">Setting Tunjangan Transport</h3>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label required">Bulan/Tahun Berlaku</label>
              <input v-model="form.bulan_tahun" type="month" class="form-control" required />
            </div>
            <div class="mb-3">
              <label class="form-label required">Base Fare Transport (Rp per Km)</label>
              <input v-model.number="form.base_fare" type="number" class="form-control" required />
            </div>
            <div class="mb-3">
              <label class="form-label required">Minimal Jarak Tempuh (KM)</label>
              <input v-model.number="form.min_km" type="number" class="form-control" required />
            </div>
            <div class="mb-3">
              <label class="form-label required">Maksimal Jarak Tempuh (KM)</label>
              <input v-model.number="form.max_km" type="number" class="form-control" required />
            </div>
            <div class="alert alert-info" role="alert">
              Nilai setting ini akan digunakan sebagai patokan dasar penghitungan tunjangan transport bulan/tahun yang dipilih.
            </div>
          </div>
          <div class="card-footer d-flex">
            <button type="submit" class="btn btn-primary ms-auto" :disabled="loading">{{ loading ? 'Menyimpan...' : 'Simpan Setting' }}</button>
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

definePageMeta({
  title: "Setting Tunjangan",
  layout: false,
  middleware: [
    function (to, from) {
      const auth = useAuthStore();
      // Hanya Admin HRD yang boleh akses halaman Setting Tunjangan Transport
      if (!auth.user || auth.user.role?.toLowerCase() !== 'admin hrd') {
        return navigateTo('/');
      }
    }
  ]
});
useSeoMeta({ title: "Setting Tunjangan" });

const loading = ref(false);

const form = ref({
  bulan_tahun: new Date().toISOString().slice(0, 7), // YYYY-MM
  base_fare: 15000,
  min_km: 10,
  max_km: 50
});

const fetchData = async () => {
  try {
    const res = await useApi('/tunjangan/setting');
    if (res) {
      form.value.base_fare = res.base_fare;
      form.value.min_km = res.min_km;
      form.value.max_km = res.max_km;
      if (res.berlaku_mulai) {
        form.value.bulan_tahun = res.berlaku_mulai.substring(0, 7);
      }
    }
  } catch (e) {
    console.error(e);
  }
};

const handleSave = async () => {
  loading.value = true;
  try {
    await useApi('/tunjangan/setting', {
      method: 'POST',
      body: {
        base_fare: form.value.base_fare,
        min_km: form.value.min_km,
        max_km: form.value.max_km,
        berlaku_mulai: `${form.value.bulan_tahun}-01`
      }
    });
    alert('Setting berhasil disimpan');
  } catch (e) {
    alert(e.data?.message || 'Gagal menyimpan setting');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>
