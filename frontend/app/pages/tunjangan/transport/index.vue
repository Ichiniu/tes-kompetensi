<template>
  <div class="card">
    <div class="card-header">
      <div class="d-flex gap-2 ms-auto">
        <NuxtLink to="/tunjangan/transport/calculate" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-plus" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
             <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
             <line x1="12" y1="5" x2="12" y2="19"></line>
             <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Kalkulasi Tunjangan
        </NuxtLink>

        <!-- Filter Tahun -->
        <select v-model="filterTahun" class="form-select" style="width: 180px">
          <option value="">Semua Tahun</option>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </select>
      </div>
    </div>
    <div class="table-responsive card-body p-0">
      <table class="table table-vcenter">
        <thead>
          <tr>
            <th width="5">No</th>
            <th>Bulan</th>
            <th>Tahun</th>
            <th class="text-center">Total Penerima</th>
            <th class="text-center">Total Tunjangan</th>
            <th class="text-center">Status</th>
            <th class="text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="text-center">Loading...</td></tr>
          <tr v-else-if="tunjanganList.length === 0"><td colspan="7" class="text-center">Belum ada data</td></tr>
          <tr v-for="(item, index) in tunjanganList" :key="item.id" v-else>
            <td class="text-center">{{ index + 1 }}</td>
            <td>{{ getMonthName(item.bulan) }}</td>
            <td>{{ item.tahun }}</td>
            <td class="text-center">{{ item.total_penerima }}</td>
            <td class="text-end">{{ formatRupiah(item.total_tunjangan) }}</td>
            <td class="text-center">
               <span class="badge" :class="item.status_hitung?.toLowerCase() === 'sudah' ? 'bg-success text-white' : 'bg-warning text-white'">
                 {{ item.status_hitung?.toUpperCase() }}
               </span>
            </td>
            <td class="text-center">
              <NuxtLink
                :to="`/tunjangan/transport/detail/${item.id}`"
                class="btn btn-info btn-sm"
                title="Detail"
              >
                <IconEye size="18" />
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useApi } from '~/composables/useApi';
import { IconEye } from '@tabler/icons-vue';
import { formatRupiah } from "~/utils/formatRupiah.js";

definePageMeta({ title: "Tunjangan Transport" });
useSeoMeta({ title: "Tunjangan Transport" });

const tunjanganList = ref([]);
const loading = ref(false);
const filterTahun = ref('');

const getMonthName = (monthNumber) => {
  const date = new Date();
  date.setMonth(monthNumber - 1);
  return date.toLocaleString('id-ID', { month: 'long' });
};

const fetchList = async () => {
  loading.value = true;
  try {
    const query = filterTahun.value ? `?tahun=${filterTahun.value}` : '';
    const data = await useApi(`/tunjangan${query}`);
    tunjanganList.value = data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchList();
});

watch(filterTahun, () => {
  fetchList();
});
</script>

