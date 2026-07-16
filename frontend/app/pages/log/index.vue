<template>
  <NuxtLayout name="default">
    <div class="card">
      <div class="card-header d-flex align-items-center">
        <div class="d-flex align-items-center gap-2 text-muted">
          <span>Tampil</span>
          <select v-model="perPage" class="form-select form-select-sm w-auto" @change="handleLimitChange">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="25">25</option>
          </select>
          <span>data</span>
        </div>
        <div class="ms-auto">
          <div class="input-group" style="width: 260px">
            <input
              v-model="searchQuery"
              @keyup.enter="handleSearch"
              type="text"
              class="form-control"
              placeholder="Cari user, modul, aksi..."
            />
            <button class="btn" type="button" @click="handleSearch">Cari</button>
          </div>
        </div>
      </div>
      <div class="table-responsive card-body p-0">
        <table class="table table-vcenter">
          <thead>
            <tr>
              <th width="5">No</th>
              <th>Nama User</th>
              <th>Modul</th>
              <th>Aksi</th>
              <th>Keterangan</th>
              <th>Waktu</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="6" class="text-center">Loading...</td></tr>
            <tr v-else-if="logList.length === 0"><td colspan="6" class="text-center">Belum ada data log</td></tr>
            <tr v-for="(item, index) in logList" :key="item.id" v-else>
              <td class="text-center">{{ (currentPage - 1) * perPage + index + 1 }}</td>
              <td>{{ item.nama_user || '-' }}</td>
              <td>{{ item.modul }}</td>
              <td>
                <span
                  class="badge"
                  :style="getAksiStyle(item.aksi)"
                >{{ item.aksi }}</span>
              </td>
              <td class="text-truncate" style="max-width: 280px">{{ item.keterangan }}</td>
              <td class="text-nowrap">{{ formatDateTime(item.tanggal) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card-footer d-flex align-items-center">
        <small class="text-secondary">Total: {{ totalRecords }} log</small>
        <ul class="pagination ms-auto m-0" v-if="totalPages > 1">
          <li class="page-item" :class="{disabled: currentPage === 1}">
            <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">Prev</a>
          </li>
          <li
            v-for="p in visiblePages"
            :key="p"
            class="page-item"
            :class="{active: currentPage === p}"
          >
            <a class="page-link" href="#" @click.prevent="changePage(p)">{{ p }}</a>
          </li>
          <li class="page-item" :class="{disabled: currentPage === totalPages}">
            <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">Next</a>
          </li>
        </ul>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useApi } from '~/composables/useApi';
import { useAuthStore } from '~/stores/useAuthStore';
import { io } from 'socket.io-client';

definePageMeta({
  title: "Log Aktivitas",
  layout: false,
  middleware: [
    function (to, from) {
      const auth = useAuthStore();
      if (!auth.user || auth.user.role?.toLowerCase() !== 'superadmin') {
        return navigateTo('/');
      }
    }
  ]
});
useSeoMeta({ title: "Log Aktivitas" });

const logList = ref([]);
const loading = ref(false);
const searchQuery = ref('');

const getAksiStyle = (aksi) => {
  const base = { textTransform: 'capitalize' };
  switch (aksi) {
    case 'read': return { ...base, backgroundColor: '#F1F1F3', color: '#4B4B52' };
    case 'create': return { ...base, backgroundColor: '#DCFCE7', color: '#16A34A' };
    case 'update': return { ...base, backgroundColor: '#FEF3C7', color: '#CA8A04' };
    case 'delete': return { ...base, backgroundColor: '#FEE2E2', color: '#DC2626' };
    case 'login': return { ...base, backgroundColor: '#E0E7FF', color: '#4338CA' };
    case 'logout': return { ...base, backgroundColor: '#F3E8FF', color: '#7E22CE' };
    case 'export': return { ...base, backgroundColor: '#CFFAFE', color: '#0E7490' };
    default: return base;
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  const pad = (n) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const currentPage = ref(1);
const totalPages = ref(1);
const totalRecords = ref(0);
const perPage = ref(10);

const handleLimitChange = () => {
  currentPage.value = 1;
  fetchList();
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchList();
};

const visiblePages = computed(() => {
  const pages = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, currentPage.value + 2);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

const fetchList = async () => {
  loading.value = true;
  try {
    let url = `/log?page=${currentPage.value}&limit=${perPage.value}`;
    if (searchQuery.value) url += `&search=${encodeURIComponent(searchQuery.value)}`;
    const res = await useApi(url);
    logList.value = res.data;
    totalPages.value = res.pagination.totalPages || 1;
    totalRecords.value = res.pagination.total || 0;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const changePage = (p) => {
  if (p >= 1 && p <= totalPages.value) {
    currentPage.value = p;
    fetchList();
  }
};

let socket = null;

onMounted(() => {
  fetchList();

  // Inisialisasi WebSocket connection dengan JWT
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  socket = io(API_URL, {
    withCredentials: true, // Akan membawa cookie (termasuk token JWT)
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  socket.on('connect', () => {
    console.log('WebSocket tersambung ke Log Server');
  });

  socket.on('connect_error', (err) => {
    console.warn('WebSocket gagal terhubung, fallback ke mode manual:', err.message);
  });

  socket.on('new_log', (data) => {
    // Hanya unshift jika user tidak sedang search dan berada di halaman pertama
    if (currentPage.value === 1 && !searchQuery.value) {
      logList.value.unshift(data);
      totalRecords.value += 1;
      // Jaga agar jumlah data tidak melebihi 20 per halaman
      if (logList.value.length > 20) {
        logList.value.pop();
      }
    }
  });
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
    console.log('WebSocket diputus');
  }
});
</script>
