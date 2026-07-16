<template>
  <div>
    <h3 class="card-title" v-if="header">Bulan {{ getMonthName(header.bulan) }} {{ header.tahun }}</h3>
    <div class="card">
      <div class="card-header">
        <NuxtLink to="/tunjangan/transport/calculate" class="btn btn-primary">Hitung Ulang Tunjangan</NuxtLink>
        <div class="ms-auto">
          <div class="input-group">
            <input v-model="searchQuery" type="text" class="form-control" placeholder="Cari Nama Penerima ..." />
            <button class="btn" type="button">
              <IconSearch :stroke="2" />
            </button>
          </div>
        </div>
      </div>
      <div class="table-responsive card-body p-0">
        <table class="table table-vcenter table-hover">
          <thead>
            <tr>
              <th style="width: 3%">No</th>
              <th @click="setSort('nama_pegawai')" class="sortable-col">
                Nama Penerima
                <SortIcon field="nama_pegawai" :current="sortKey" :order="sortOrder" />
              </th>
              <th @click="setSort('km_dihitung')" class="sortable-col text-center">
                Km
                <SortIcon field="km_dihitung" :current="sortKey" :order="sortOrder" />
              </th>
              <th @click="setSort('hari_kerja')" class="sortable-col text-center">
                Hari
                <SortIcon field="hari_kerja" :current="sortKey" :order="sortOrder" />
              </th>
              <th @click="setSort('nominal')" class="sortable-col text-end">
                Nominal
                <SortIcon field="nominal" :current="sortKey" :order="sortOrder" />
              </th>
            </tr>
          </thead>
          <tbody v-if="loading">
            <tr><td colspan="5" class="text-center py-4">Memuat data...</td></tr>
          </tbody>
          <tbody v-else-if="sortedFiltered.length === 0">
            <tr><td colspan="5" class="text-center py-4 text-muted">Belum ada data penerima</td></tr>
          </tbody>
          <tbody v-else>
            <tr v-for="(item, index) in sortedFiltered" :key="item.id">
              <td class="text-center">{{ index + 1 }}</td>
              <td>{{ item.nama_pegawai }}</td>
              <td class="text-center">{{ item.km_dihitung }}</td>
              <td class="text-center">{{ item.hari_kerja }}</td>
              <td class="text-end">{{ formatRupiah(item.nominal) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card-footer text-muted" v-if="header">
        Total Penerima: <strong>{{ header.total_penerima }}</strong> &nbsp;|&nbsp;
        Total Tunjangan: <strong>{{ formatRupiah(header.total_tunjangan) }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '~/composables/useApi';
import { IconSearch, IconChevronUp, IconChevronDown, IconSelector } from '@tabler/icons-vue';
import { formatRupiah } from '~/utils/formatRupiah.js';

// Inline sort icon component
const SortIcon = {
  props: ['field', 'current', 'order'],
  components: { IconChevronUp, IconChevronDown, IconSelector },
  template: `
    <span class="sort-icon ms-1">
      <IconChevronUp v-if="current === field && order === 'asc'" :size="14" />
      <IconChevronDown v-else-if="current === field && order === 'desc'" :size="14" />
      <IconSelector v-else :size="14" class="text-muted" />
    </span>
  `
};

definePageMeta({ title: 'Detail Tunjangan Transport' });

const route = useRoute();
const header    = ref(null);
const rawList   = ref([]);
const loading   = ref(true);
const searchQuery = ref('');
const sortKey   = ref('nama_pegawai');
const sortOrder = ref('asc');

const getMonthName = (n) => {
  if (!n) return '';
  return new Date(2000, n - 1, 1).toLocaleString('id-ID', { month: 'long' });
};

const setSort = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

const sortedFiltered = computed(() => {
  let list = rawList.value;

  // Search filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(i => i.nama_pegawai?.toLowerCase().includes(q));
  }

  // Sort
  const key = sortKey.value;
  const mult = sortOrder.value === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    if (typeof a[key] === 'string') return a[key].localeCompare(b[key]) * mult;
    return (a[key] - b[key]) * mult;
  });
});

const fetchData = async () => {
  loading.value = true;
  try {
    const data = await useApi(`/tunjangan/${route.params.id}`);
    if (data) {
      header.value  = data.header;
      rawList.value = data.detail || [];
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
.sortable-col {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
.sortable-col:hover {
  background-color: rgba(0,0,0,0.03);
}
.sort-icon {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}
</style>
