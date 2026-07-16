<script setup>
import { ref, computed, watch, defineAsyncComponent } from 'vue';
import { useAuthStore } from '~/stores/useAuthStore';
import { useApi } from '~/composables/useApi';
import { IconEye, IconUsers, IconBriefcase, IconUserCheck, IconSchool, IconTrendingUp, IconGenderMale, IconGenderFemale } from '@tabler/icons-vue';

const Apexchart = defineAsyncComponent(() => import('vue3-apexcharts'));

definePageMeta({ title: "Dashboard", layout: false });
useSeoMeta({ title: "Dashboard" });

const authStore = useAuthStore();
const roleName = computed(() => authStore.user?.role || '');
const isManagerHRD = computed(() => roleName.value === 'Manager HRD');
const isAdminHRD = computed(() => roleName.value === 'Admin HRD');
const isSuperadmin = computed(() => !isManagerHRD.value && !isAdminHRD.value);

const stats = ref({ total: 0, total_tetap: 0, total_kontrak: 0, total_magang: 0, total_laki: 0, total_perempuan: 0 });
const pegawaiTerbaru = ref([]);
const chartLoaded = ref(false);

const statusPegawaiSeries = computed(() => [
  Number(stats.value.total_tetap) || 0,
  Number(stats.value.total_kontrak) || 0,
  Number(stats.value.total_magang) || 0
]);

const statusPegawaiOptions = computed(() => ({
  chart: {
    type: 'donut',
    height: 260,
    animations: { enabled: true, speed: 600 },
    dropShadow: { enabled: false },
    toolbar: { show: false }
  },
  labels: ['Tetap (PKWTT)', 'Kontrak (PKWT)', 'Magang'],
  colors: ['#E8792E', '#1F1F23', '#E5E5E8'],
  legend: {
    position: 'bottom',
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    markers: { width: 10, height: 10, radius: 5 },
    itemMargin: { horizontal: 10 }
  },
  dataLabels: {
    enabled: true,
    style: { fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '600' },
    dropShadow: { enabled: false }
  },
  plotOptions: {
    pie: {
      donut: {
        size: '68%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            color: '#6B6B72',
            formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0)
          },
          value: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '22px',
            fontWeight: '700',
            color: '#1F1F23'
          }
        }
      }
    }
  },
  stroke: { width: 2, colors: ['#fff'] },
  tooltip: { style: { fontFamily: 'Inter, sans-serif' } }
}));

const genderPegawaiSeries = computed(() => [
  Number(stats.value.total_laki) || 0,
  Number(stats.value.total_perempuan) || 0
]);

const genderPegawaiOptions = computed(() => ({
  chart: {
    type: 'donut',
    height: 260,
    animations: { enabled: true, speed: 600 },
    toolbar: { show: false }
  },
  labels: ['Laki-laki', 'Perempuan'],
  colors: ['#E8792E', '#E5E5E8'],
  legend: {
    position: 'bottom',
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    markers: { width: 10, height: 10, radius: 5 },
    itemMargin: { horizontal: 10 }
  },
  dataLabels: {
    enabled: true,
    style: { fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '600' },
    dropShadow: { enabled: false }
  },
  plotOptions: {
    pie: {
      donut: {
        size: '68%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            color: '#6B6B72',
            formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0)
          },
          value: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '22px',
            fontWeight: '700',
            color: '#1F1F23'
          }
        }
      }
    }
  },
  stroke: { width: 2, colors: ['#fff'] },
  tooltip: { style: { fontFamily: 'Inter, sans-serif' } }
}));

const formatDate = (val) => {
  const d = new Date(Number(val) || val);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const statusLabel = (sk) => {
  if (sk === 'PKWTT') return 'Tetap';
  if (sk === 'PKWT') return 'Kontrak';
  return sk;
};

const loadDashboardStats = async () => {
  try {
    const res = await useApi('/pegawai/dashboard-stats');
    if (res && res.stats) {
      stats.value = res.stats;
      pegawaiTerbaru.value = res.terbaru || [];
    }
  } catch (e) {
    console.error(e);
  } finally {
    chartLoaded.value = true;
  }
};

watch(isManagerHRD, (isManager) => {
  if (isManager) loadDashboardStats();
}, { immediate: true });
</script>

<template>
  <NuxtLayout name="default">
    <!-- Superadmin & Admin HRD: Welcome screen -->
    <template v-if="isSuperadmin || isAdminHRD">
      <div class="db-welcome-wrap">
        <div class="db-welcome-card">
          <img src="@/assets/images/greeting-img.svg" alt="" class="db-welcome-img" />
          <h2 class="db-welcome-title">Selamat Datang,<br/>{{ authStore.user?.username }}</h2>
          <p class="db-welcome-role">{{ roleName }}</p>
        </div>
      </div>
    </template>

    <!-- Manager HRD: Full analytics dashboard -->
    <template v-else-if="isManagerHRD">

      <!-- Header -->
      <div class="db-header">
        <div class="db-header-left">
          <h1 class="db-page-title">Dashboard Analitik</h1>
          <p class="db-page-subtitle">Ringkasan data kepegawaian secara real-time</p>
        </div>
        <div class="db-header-right">
          <div class="db-greeting-pill">
            <span class="db-greeting-dot"></span>
            Halo, {{ authStore.user?.username?.toUpperCase() || 'Manager HRD' }}
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="db-stats-grid">
        <div class="db-stat-card db-stat-accent">
          <div class="db-stat-icon">
            <IconUsers size="22" />
          </div>
          <div class="db-stat-info">
            <span class="db-stat-value">{{ stats.total }}</span>
            <span class="db-stat-label">Total Pegawai</span>
          </div>
          <div class="db-stat-bar" style="width:100%"></div>
        </div>
        <div class="db-stat-card">
          <div class="db-stat-icon db-stat-icon-secondary">
            <IconBriefcase size="22" />
          </div>
          <div class="db-stat-info">
            <span class="db-stat-value">{{ stats.total_kontrak }}</span>
            <span class="db-stat-label">Pegawai Kontrak</span>
          </div>
          <div class="db-stat-bar" :style="`width:${stats.total > 0 ? (stats.total_kontrak / stats.total * 100) : 0}%`"></div>
        </div>
        <div class="db-stat-card">
          <div class="db-stat-icon db-stat-icon-success">
            <IconUserCheck size="22" />
          </div>
          <div class="db-stat-info">
            <span class="db-stat-value">{{ stats.total_tetap }}</span>
            <span class="db-stat-label">Pegawai Tetap</span>
          </div>
          <div class="db-stat-bar" :style="`width:${stats.total > 0 ? (stats.total_tetap / stats.total * 100) : 0}%`"></div>
        </div>
        <div class="db-stat-card">
          <div class="db-stat-icon db-stat-icon-warning">
            <IconSchool size="22" />
          </div>
          <div class="db-stat-info">
            <span class="db-stat-value">{{ stats.total_magang }}</span>
            <span class="db-stat-label">Peserta Magang</span>
          </div>
          <div class="db-stat-bar" :style="`width:${stats.total > 0 ? (stats.total_magang / stats.total * 100) : 0}%`"></div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="db-charts-grid">
        <!-- Donut - Status Kontrak -->
        <div class="db-chart-card">
          <div class="db-chart-header">
            <div>
              <h3 class="db-chart-title">Komposisi Status Kontrak</h3>
              <p class="db-chart-subtitle">Distribusi berdasarkan jenis kontrak kerja</p>
            </div>
            <IconTrendingUp size="18" class="db-chart-icon" />
          </div>
          <ClientOnly>
            <Apexchart
              v-if="chartLoaded"
              type="donut"
              height="280"
              :options="statusPegawaiOptions"
              :series="statusPegawaiSeries"
            />
            <div v-else class="db-chart-skeleton"></div>
          </ClientOnly>
        </div>

        <!-- Donut - Gender -->
        <div class="db-chart-card">
          <div class="db-chart-header">
            <div>
              <h3 class="db-chart-title">Komposisi Gender Pegawai</h3>
              <p class="db-chart-subtitle">Distribusi berdasarkan jenis kelamin</p>
            </div>
            <div class="db-gender-badges">
              <span class="db-gender-badge db-gender-badge-l"><IconGenderMale size="13"/>{{ stats.total_laki }}</span>
              <span class="db-gender-badge db-gender-badge-p"><IconGenderFemale size="13"/>{{ stats.total_perempuan }}</span>
            </div>
          </div>
          <ClientOnly>
            <Apexchart
              v-if="chartLoaded"
              type="donut"
              height="280"
              :options="genderPegawaiOptions"
              :series="genderPegawaiSeries"
            />
            <div v-else class="db-chart-skeleton"></div>
          </ClientOnly>
        </div>
      </div>

      <!-- Recent Employees Table -->
      <div class="db-table-card">
        <div class="db-table-header">
          <div>
            <h3 class="db-chart-title">Pegawai Terbaru</h3>
            <p class="db-chart-subtitle">5 data pegawai yang terakhir ditambahkan</p>
          </div>
          <NuxtLink to="/pegawai" class="db-view-all-btn">Lihat Semua →</NuxtLink>
        </div>
        <div class="table-responsive">
          <table class="table db-table">
            <thead>
              <tr>
                <th>#</th>
                <th>NIP</th>
                <th>Nama Lengkap</th>
                <th>Jabatan</th>
                <th>Tanggal Masuk</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="pegawaiTerbaru.length === 0">
                <td colspan="7" class="db-empty-row">Belum ada data pegawai</td>
              </tr>
              <tr v-for="(item, index) in pegawaiTerbaru" :key="item.id" class="db-table-row">
                <td class="db-table-no">{{ index + 1 }}</td>
                <td><code class="db-nip">{{ item.nip }}</code></td>
                <td class="db-table-name">{{ item.nama_pegawai }}</td>
                <td class="db-table-jabatan">{{ item.nama_jabatan || '-' }}</td>
                <td class="db-table-date">{{ formatDate(item.tanggal_masuk) }}</td>
                <td>
                  <span class="db-status-badge" :class="{
                    'db-status-tetap': item.status_kontrak === 'PKWTT',
                    'db-status-kontrak': item.status_kontrak === 'PKWT',
                    'db-status-magang': item.status_kontrak === 'Magang'
                  }">{{ statusLabel(item.status_kontrak) }}</span>
                </td>
                <td>
                  <NuxtLink :to="`/pegawai/${item.nip}`" class="db-action-btn" title="Lihat Detail">
                    <IconEye size="16" />
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </template>
  </NuxtLayout>
</template>

<style scoped>
/* ── Fonts ── */
* { font-family: 'Inter', sans-serif; }

/* ── Welcome screen ── */
.db-welcome-wrap { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
.db-welcome-card { text-align: center; background: var(--bg-surface, #F7F7F8); border-radius: 20px; padding: 48px 56px; max-width: 480px; width: 100%; }
.db-welcome-img { max-height: 160px; margin-bottom: 24px; }
.db-welcome-title { font-size: 1.75rem; font-weight: 700; color: var(--text-primary, #1F1F23); margin-bottom: 8px; }
.db-welcome-role { font-size: 0.95rem; color: var(--text-secondary, #6B6B72); }

/* ── Page Header ── */
.db-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.db-page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary, #1F1F23); margin: 0; }
.db-page-subtitle { font-size: 0.85rem; color: var(--text-secondary, #6B6B72); margin: 4px 0 0; }
.db-greeting-pill { display: inline-flex; align-items: center; gap: 8px; background: var(--bg-surface, #F7F7F8); border: 1px solid var(--border, #E5E5E8); border-radius: 50px; padding: 8px 16px; font-size: 0.85rem; font-weight: 500; color: var(--text-primary, #1F1F23); }
.db-greeting-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; display: inline-block; box-shadow: 0 0 0 2px rgba(34,197,94,.2); }

/* ── Stats Grid ── */
.db-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
@media (max-width: 900px) { .db-stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px) { .db-stats-grid { grid-template-columns: 1fr; } }

.db-stat-card { background: var(--bg-base, #fff); border: 1px solid var(--border, #E5E5E8); border-radius: 16px; padding: 20px; position: relative; overflow: hidden; transition: box-shadow 0.2s, transform 0.2s; cursor: default; }
.db-stat-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }
.db-stat-accent { border-top: 3px solid var(--accent, #E8792E); }

.db-stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: rgba(232,121,46,0.1); color: var(--accent, #E8792E); margin-bottom: 14px; }
.db-stat-icon-secondary { background: rgba(31,31,35,0.08); color: var(--text-primary, #1F1F23); }
.db-stat-icon-success { background: rgba(34,197,94,0.1); color: #16a34a; }
.db-stat-icon-warning { background: rgba(234,179,8,0.1); color: #ca8a04; }

.db-stat-value { font-size: 2rem; font-weight: 800; color: var(--text-primary, #1F1F23); display: block; line-height: 1; margin-bottom: 6px; }
.db-stat-label { font-size: 0.8rem; color: var(--text-secondary, #6B6B72); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }

.db-stat-bar { height: 3px; background: var(--accent, #E8792E); border-radius: 2px; position: absolute; bottom: 0; left: 0; transition: width 0.8s ease; opacity: 0.5; }
.db-stat-card { padding-bottom: 18px; }

/* ── Charts Grid ── */
.db-charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
@media (max-width: 768px) { .db-charts-grid { grid-template-columns: 1fr; } }

.db-chart-card { background: var(--bg-base, #fff); border: 1px solid var(--border, #E5E5E8); border-radius: 16px; padding: 24px; transition: box-shadow 0.2s; }
.db-chart-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.06); }

.db-chart-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px; }
.db-chart-title { font-size: 0.95rem; font-weight: 700; color: var(--text-primary, #1F1F23); margin: 0 0 4px; }
.db-chart-subtitle { font-size: 0.78rem; color: var(--text-secondary, #6B6B72); margin: 0; }
.db-chart-icon { color: var(--text-secondary, #6B6B72); flex-shrink: 0; margin-top: 2px; }

.db-gender-badges { display: flex; gap: 6px; flex-shrink: 0; }
.db-gender-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
.db-gender-badge-l { background: rgba(232,121,46,0.1); color: var(--accent, #E8792E); }
.db-gender-badge-p { background: rgba(229,229,232,0.8); color: var(--text-secondary, #6B6B72); }

.db-chart-skeleton { height: 280px; background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; border-radius: 8px; animation: shimmer 1.5s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── Table ── */
.db-table-card { background: var(--bg-base, #fff); border: 1px solid var(--border, #E5E5E8); border-radius: 16px; overflow: hidden; }
.db-table-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid var(--border, #E5E5E8); flex-wrap: wrap; gap: 12px; }

.db-view-all-btn { font-size: 0.82rem; font-weight: 600; color: var(--accent, #E8792E); text-decoration: none; padding: 6px 14px; border: 1px solid var(--accent, #E8792E); border-radius: 8px; transition: background 0.15s, color 0.15s; }
.db-view-all-btn:hover { background: var(--accent, #E8792E); color: #fff; }

.db-table { margin: 0; }
.db-table thead th { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary, #6B6B72); border-bottom: 1px solid var(--border, #E5E5E8); padding: 10px 16px; background: var(--bg-surface, #F7F7F8); }
.db-table tbody td { padding: 12px 16px; border-bottom: 1px solid var(--border, #E5E5E8); vertical-align: middle; }
.db-table-row:last-child td { border-bottom: none; }
.db-table-row { transition: background 0.15s; }
.db-table-row:hover { background: var(--bg-surface, #F7F7F8); }

.db-table-no { font-size: 0.8rem; color: var(--text-secondary, #6B6B72); width: 36px; text-align: center; }
.db-nip { font-size: 0.78rem; background: var(--bg-surface, #F7F7F8); padding: 2px 8px; border-radius: 6px; color: var(--text-primary, #1F1F23); font-family: 'Courier New', monospace; }
.db-table-name { font-weight: 600; font-size: 0.88rem; color: var(--text-primary, #1F1F23); }
.db-table-jabatan, .db-table-date { font-size: 0.84rem; color: var(--text-secondary, #6B6B72); }
.db-empty-row { text-align: center; padding: 32px; color: var(--text-secondary, #6B6B72); font-size: 0.88rem; }

.db-status-badge { font-size: 0.73rem; font-weight: 600; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.04em; }
.db-status-tetap { background: rgba(34,197,94,0.12); color: #16a34a; }
.db-status-kontrak { background: rgba(232,121,46,0.12); color: var(--accent, #E8792E); }
.db-status-magang { background: rgba(234,179,8,0.12); color: #ca8a04; }

.db-action-btn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: var(--bg-surface, #F7F7F8); border: 1px solid var(--border, #E5E5E8); color: var(--text-primary, #1F1F23); text-decoration: none; transition: background 0.15s, border-color 0.15s, color 0.15s; }
.db-action-btn:hover { background: var(--accent, #E8792E); border-color: var(--accent, #E8792E); color: #fff; }
</style>
