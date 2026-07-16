<template>
  <NuxtLayout name="default">
    <template #actions>
      <div v-if="isAdmin" class="d-flex gap-2">
        <a :href="exportPdfUrl" target="_blank" class="btn btn-outline-danger">Export PDF</a>
        <a :href="exportExcelUrl" target="_blank" class="btn btn-outline-success">Export Excel</a>
        <NuxtLink to="/pegawai/form" class="btn btn-primary">Tambah Data</NuxtLink>
      </div>
    </template>
    
    <!-- Filter Section -->
    <div class="card mb-3">
      <div class="card-body py-3">
        <div class="row g-3 align-items-end">
          <!-- Pencarian -->
          <div class="col-md-5">
            <label class="form-label fw-semibold small text-muted mb-1 d-flex align-items-center gap-1">
              <IconSearch size="16" /> Pencarian
            </label>
            <input v-model="filters.search" type="text" class="form-control" placeholder="Ketik Nama, NIP, atau Jabatan...">
          </div>
          <!-- Status Kontrak -->
          <div class="col-md-3">
            <label class="form-label fw-semibold small text-muted mb-1 d-flex align-items-center gap-1">
              <IconFileDescription size="16" /> Status Kontrak
            </label>
            <select v-model="filters.status_kontrak" class="form-select">
              <option value="">Semua</option>
              <option value="PKWTT">PKWTT</option>
              <option value="PKWT">PKWT</option>
              <option value="Magang">Magang</option>
            </select>
          </div>
          <!-- Masa Kerja -->
          <div class="col-md-4">
            <label class="form-label fw-semibold small text-muted mb-1 d-flex align-items-center gap-1">
              <IconCalendarEvent size="16" /> Masa Kerja (Tahun)
            </label>
            <div class="d-flex gap-2 align-items-center">
              <input v-model="filters.masa_kerja_min" type="number" class="form-control" placeholder="Min" min="0">
              <span class="text-muted">—</span>
              <input v-model="filters.masa_kerja_max" type="number" class="form-control" placeholder="Max" min="0">
            </div>
          </div>
        </div>
        <!-- Jabatan Filter (Checkbox) -->
        <div v-if="masterJabatan.length > 0" class="mt-3 pt-3 border-top">
          <label class="form-label fw-semibold small text-muted mb-2 d-flex align-items-center gap-1">
            <IconBriefcase size="16" /> Filter Jabatan
          </label>
          <div class="d-flex flex-wrap gap-2">
            <label v-for="j in masterJabatan" :key="j.id" class="form-check form-check-inline m-0">
              <input class="form-check-input" type="checkbox" :value="j.id" v-model="filters.jabatan">
              <span class="form-check-label small">{{ j.nama }}</span>
            </label>
          </div>
        </div>
        <!-- Active filter badges -->
        <div v-if="hasActiveFilters" class="mt-2 pt-2 border-top d-flex align-items-center gap-2 flex-wrap">
          <span class="text-muted small">Filter aktif:</span>
          <span v-if="filters.search" class="badge bg-primary-lt">
            Cari: "{{ filters.search }}" <a href="#" @click.prevent="filters.search = ''" class="ms-1 text-primary">&times;</a>
          </span>
          <span v-if="filters.status_kontrak" class="badge bg-info-lt">
            {{ filters.status_kontrak }} <a href="#" @click.prevent="filters.status_kontrak = ''" class="ms-1 text-info">&times;</a>
          </span>
          <span v-if="filters.masa_kerja_min || filters.masa_kerja_max" class="badge bg-warning-lt">
            Masa Kerja: {{ filters.masa_kerja_min || '0' }} - {{ filters.masa_kerja_max || '∞' }} thn
            <a href="#" @click.prevent="filters.masa_kerja_min = ''; filters.masa_kerja_max = ''" class="ms-1 text-warning">&times;</a>
          </span>
          <span v-for="jId in filters.jabatan" :key="jId" class="badge bg-success-lt">
            {{ masterJabatan.find(j => j.id === jId)?.nama }}
            <a href="#" @click.prevent="filters.jabatan = filters.jabatan.filter(x => x !== jId)" class="ms-1 text-success">&times;</a>
          </span>
          <a href="#" @click.prevent="resetFilter" class="ms-auto small text-danger"><i class="bi bi-x-circle me-1"></i>Reset Semua</a>
        </div>
      </div>
    </div>

    <!-- Bulk Action Bar -->
    <div v-if="selectedIds.length > 0 && isAdmin" class="alert alert-info d-flex align-items-center mb-3">
      <div class="me-auto">{{ selectedIds.length }} data terpilih</div>
      <div class="d-flex gap-2">
        <select v-model="bulkStatus" class="form-select w-auto">
          <option value="">Ubah Status...</option>
          <option value="Aktif">Aktif</option>
          <option value="Nonaktif">Nonaktif</option>
        </select>
        <button class="btn btn-primary" :disabled="!bulkStatus || bulkLoading" @click="handleBulkStatus">Set Status</button>
        <button class="btn btn-danger" @click="handleBulkDelete" :disabled="bulkLoading">Hapus Terpilih</button>
      </div>
    </div>

    <div class="card">
      <div class="table-responsive card-body p-0">
        <table class="table table-vcenter">
          <thead>
            <tr>
              <th width="5" v-if="isAdmin"><input type="checkbox" class="form-check-input" :checked="isAllSelected" @change="toggleSelectAll"></th>
              <th width="5">No</th>
              <th class="cursor-pointer" @click="changeSort('NIP')">
                NIP <span v-if="sortBy==='NIP'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th class="cursor-pointer" @click="changeSort('Nama')">
                Nama <span v-if="sortBy==='Nama'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th class="cursor-pointer" @click="changeSort('Jabatan')">
                Jabatan <span v-if="sortBy==='Jabatan'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th class="cursor-pointer" @click="changeSort('Tanggal Masuk')">
                Tanggal Masuk <span v-if="sortBy==='Tanggal Masuk'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th class="cursor-pointer" @click="changeSort('Masa Kerja')">
                Masa Kerja <span v-if="sortBy==='Masa Kerja'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th class="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="8" class="text-center">Loading...</td></tr>
            <tr v-else-if="pegawaiList.length === 0"><td colspan="8" class="text-center">Belum ada data pegawai</td></tr>
            <tr v-for="(item, index) in pegawaiList" :key="item.id" v-else>
              <td v-if="isAdmin"><input type="checkbox" class="form-check-input" :value="item.id" v-model="selectedIds"></td>
              <td class="text-center">{{ (currentPage - 1) * perPage + index + 1 }}</td>
              <td>{{ item.nip }}</td>
              <td>
                <div class="font-weight-medium">{{ item.nama_pegawai }}</div>
                <div class="text-muted text-sm">Status: {{ item.status }} | {{ item.status_kontrak }}</div>
              </td>
              <td>{{ item.nama_jabatan || '-' }}</td>
              <td>{{ new Date(item.tanggal_masuk).toLocaleDateString('id-ID') }}</td>
              <td>{{ item.masa_kerja }}</td>
              <td class="text-nowrap text-center">
                <div class="d-flex justify-content-center gap-1">
                  <NuxtLink :to="`/pegawai/${item.nip}`" class="btn btn-sm btn-info" title="Detail"><IconEye size="18" /></NuxtLink>
                  <NuxtLink v-if="isAdmin" :to="`/pegawai/form/${item.id}`" class="btn btn-sm btn-primary" title="Edit"><IconPencil size="18" /></NuxtLink>
                  <a v-if="isAdmin" :href="`${apiBase}/pegawai/export/pdf/${item.id}`" target="_blank" class="btn btn-sm btn-danger" title="Download PDF"><IconFileTypePdf size="18" /></a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card-footer d-flex align-items-center">
        <div class="d-flex align-items-center gap-2">
          <span class="text-muted small">Tampilkan</span>
          <select v-model="perPage" class="form-select form-select-sm" style="width: auto;" @change="changePerPage">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="25">25</option>
          </select>
          <span class="text-muted small">data per halaman</span>
        </div>
        <ul class="pagination ms-auto m-0" v-if="totalPages > 1">
          <li class="page-item" :class="{disabled: currentPage === 1}">
            <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">Prev</a>
          </li>
          <li class="page-item" v-for="p in totalPages" :key="p" :class="{active: currentPage === p}">
            <a class="page-link" href="#" @click.prevent="changePage(p)">{{ p }}</a>
          </li>
          <li class="page-item" :class="{disabled: currentPage === totalPages}">
            <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">Next</a>
          </li>
        </ul>
      </div>
    </div>

    <!-- Modal Detail Pegawai -->
    <div v-if="showDetailModal" class="modal modal-blur fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5); backdrop-filter: blur(5px);">
      <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detail Pegawai</h5>
            <button type="button" class="btn-close" @click="closeDetailModal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="detailLoading">
            <div class="text-center py-4">
              <div class="spinner-border text-primary" role="status"></div>
              <div class="mt-2">Memuat data pegawai...</div>
            </div>
          </div>
          <div class="modal-body p-4" v-else-if="detailData">
            <div class="row mb-4">
              <div class="col-md-3 text-center">
                <img :src="getFotoUrl(detailData.id)" class="img-fluid rounded-circle border shadow-sm mb-3" alt="Foto Pegawai" style="width: 150px; height: 150px; object-fit: cover;" @error="$event.target.src='https://ui-avatars.com/api/?name=' + detailData.nama_pegawai + '&background=random'">
                <h4 class="m-0 mb-1">{{ detailData.nama_pegawai }}</h4>
                <div class="text-muted">{{ detailData.nip }}</div>
                <div class="mt-2">
                  <span class="badge" :class="detailData.status === 'Aktif' ? 'bg-success' : 'bg-danger'">{{ detailData.status || 'Tidak Diketahui' }}</span>
                </div>
              </div>
              <div class="col-md-9">
                <div class="row g-3">
                  <div class="col-12">
                    <h5 class="text-primary border-bottom pb-2 mb-3">Informasi Pribadi</h5>
                  </div>
                  <div class="col-md-6">
                    <div class="text-muted mb-1 small">Tempat, Tanggal Lahir (Usia)</div>
                    <div class="fw-medium">{{ detailData.tempat_lahir || '-' }}, {{ detailData.tanggal_lahir ? new Date(detailData.tanggal_lahir).toLocaleDateString('id-ID') : '-' }} ({{ detailData.usia || '-' }} th)</div>
                  </div>
                  <div class="col-md-6">
                    <div class="text-muted mb-1 small">Nomor HP</div>
                    <div class="fw-medium">{{ detailData.nomor_hp || '-' }}</div>
                  </div>
                  <div class="col-md-6">
                    <div class="text-muted mb-1 small">Email</div>
                    <div class="fw-medium">{{ detailData.email || '-' }}</div>
                  </div>
                  <div class="col-md-6">
                    <div class="text-muted mb-1 small">Status Pernikahan</div>
                    <div class="fw-medium">{{ detailData.status_kawin || '-' }}</div>
                  </div>
                  <div class="col-md-6">
                    <div class="text-muted mb-1 small">Jumlah Anak</div>
                    <div class="fw-medium">{{ detailData.jumlah_anak || '0' }}</div>
                  </div>

                  <div class="col-12 mt-4">
                    <h5 class="text-primary border-bottom pb-2 mb-3">Kontak & Alamat</h5>
                  </div>
                  <div class="col-md-6">
                    <div class="text-muted mb-1 small">Alamat Lengkap</div>
                    <div class="fw-medium">{{ detailData.alamat_lengkap || '-' }}</div>
                  </div>
                  <div class="col-md-6">
                    <div class="text-muted mb-1 small">Wilayah (Kec/Kab/Prov)</div>
                    <div class="fw-medium">{{ detailData.kecamatan || '-' }}, {{ detailData.kabupaten || '-' }}, {{ detailData.provinsi || '-' }}</div>
                  </div>
                  <div class="col-md-6">
                    <div class="text-muted mb-1 small">Jarak Rumah - Kantor</div>
                    <div class="fw-medium">{{ detailData.jarak_rumah_kantor || '0' }} KM</div>
                  </div>

                  <div class="col-12 mt-4">
                    <h5 class="text-primary border-bottom pb-2 mb-3">Kepegawaian & Tunjangan</h5>
                  </div>
                  <div class="col-md-6">
                    <div class="text-muted mb-1 small">Jabatan / Departemen</div>
                    <div class="fw-medium">{{ detailData.nama_jabatan || '-' }} / {{ detailData.nama_departemen || '-' }}</div>
                  </div>
                  <div class="col-md-6">
                    <div class="text-muted mb-1 small">Status Kontrak</div>
                    <div class="fw-medium">{{ detailData.status_kontrak || '-' }}</div>
                  </div>
                  <div class="col-md-6">
                    <div class="text-muted mb-1 small">Tanggal Masuk (Masa Kerja)</div>
                    <div class="fw-medium">{{ detailData.tanggal_masuk ? new Date(detailData.tanggal_masuk).toLocaleDateString('id-ID') : '-' }}{{ detailData.masa_kerja ? ` (${detailData.masa_kerja})` : '' }}</div>
                  </div>
                  <div class="col-md-6">
                    <div class="text-muted mb-1 small">Tunjangan Transport</div>
                    <div class="fw-medium text-success">Rp {{ detailData.tunjangan_transport?.toLocaleString('id-ID') || '0' }}</div>
                  </div>
                </div>
              </div>

              <!-- Tabel Pendidikan -->
              <div class="col-12 mt-4">
                <h5 class="text-primary border-bottom pb-2 mb-3">Riwayat Pendidikan</h5>
                <div class="table-responsive">
                  <table class="table table-vcenter card-table table-striped table-sm">
                    <thead>
                      <tr>
                        <th>Tingkat</th>
                        <th>Nama Institusi</th>
                        <th>Tahun Lulus</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="!detailData.pendidikan || detailData.pendidikan.length === 0">
                        <td colspan="3" class="text-center text-muted py-3">Belum ada data riwayat pendidikan.</td>
                      </tr>
                      <tr v-for="(edu, idx) in detailData.pendidikan" :key="idx" v-else>
                        <td>{{ edu.tingkat_pendidikan }}</td>
                        <td>{{ edu.nama_sekolah }}</td>
                        <td>{{ edu.tahun_lulus }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn me-auto" @click="closeDetailModal">Tutup</button>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useApi } from '~/composables/useApi';
import { 
  IconSearch, 
  IconFileDescription, 
  IconCalendarEvent, 
  IconBriefcase, 
  IconEye, 
  IconPencil, 
  IconFileTypePdf 
} from '@tabler/icons-vue';
import { useAuthStore } from '~/stores/useAuthStore';

definePageMeta({ title: "Data Pegawai", layout: false });
useSeoMeta({ title: "Data Pegawai" });

const authStore = useAuthStore();
const isAdmin = computed(() => {
  return authStore.user?.role !== 'Manager HRD';
});

const runtimeConfig = useRuntimeConfig();
const apiBase = runtimeConfig.public.apiBase || 'http://localhost:3001/api';
const exportPdfUrl = computed(() => `${apiBase}/pegawai/export/pdf`);
const exportExcelUrl = computed(() => `${apiBase}/pegawai/export/excel`);

const pegawaiList = ref([]);
const masterJabatan = ref([]);
const loading = ref(false);

const showDetailModal = ref(false);
const detailData = ref(null);
const detailLoading = ref(false);

const getFotoUrl = (id) => {
  return `${apiBase}/pegawai/${id}/foto`;
};

const openDetailModal = async (id) => {
  showDetailModal.value = true;
  detailLoading.value = true;
  detailData.value = null;
  try {
    const res = await useApi(`/pegawai/${id}`);
    detailData.value = res;
  } catch (e) {
    alert(e.data?.message || 'Gagal memuat detail pegawai');
    showDetailModal.value = false;
  } finally {
    detailLoading.value = false;
  }
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  setTimeout(() => {
    detailData.value = null;
  }, 300);
};

const filters = ref({
  search: '',
  status_kontrak: '',
  masa_kerja_min: '',
  masa_kerja_max: '',
  jabatan: []
});

const hasActiveFilters = computed(() => {
  return filters.value.search || filters.value.status_kontrak ||
    filters.value.masa_kerja_min !== '' || filters.value.masa_kerja_max !== '' ||
    filters.value.jabatan.length > 0;
});

// Auto-apply filter dengan debounce 400ms
let filterDebounce = null;
watch(filters, () => {
  clearTimeout(filterDebounce);
  filterDebounce = setTimeout(() => {
    currentPage.value = 1;
    fetchList();
  }, 400);
}, { deep: true });

const applyFilter = () => {
  currentPage.value = 1;
  fetchList();
};

const sortBy = ref('pegawai.id');
const sortOrder = ref('desc');
const currentPage = ref(1);
const perPage = ref(10);
const totalPages = ref(1);
const totalData = ref(0);

const selectedIds = ref([]);
const bulkStatus = ref('');
const bulkLoading = ref(false);

const isAllSelected = computed(() => {
  return pegawaiList.value.length > 0 && selectedIds.value.length === pegawaiList.value.length;
});

const toggleSelectAll = (e) => {
  if (e.target.checked) {
    selectedIds.value = pegawaiList.value.map(p => p.id);
  } else {
    selectedIds.value = [];
  }
};

const changeSort = (col) => {
  if (sortBy.value === col) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = col;
    sortOrder.value = 'asc';
  }
  fetchList();
};

const resetFilter = () => {
  filters.value = { search: '', status_kontrak: '', masa_kerja_min: '', masa_kerja_max: '', jabatan: [] };
  currentPage.value = 1;
  fetchList();
};

const fetchList = async () => {
  loading.value = true;
  selectedIds.value = [];
  try {
    const params = new URLSearchParams({
      page: currentPage.value,
      limit: perPage.value,
      sort_by: sortBy.value,
      sort_order: sortOrder.value
    });
    
    if (filters.value.search) params.append('search', filters.value.search);
    if (filters.value.status_kontrak) params.append('status_kontrak', filters.value.status_kontrak);
    if (filters.value.masa_kerja_min !== '') params.append('masa_kerja_min', filters.value.masa_kerja_min);
    if (filters.value.masa_kerja_max !== '') params.append('masa_kerja_max', filters.value.masa_kerja_max);
    if (filters.value.jabatan.length > 0) {
      filters.value.jabatan.forEach(j => params.append('jabatan', j));
    }

    const res = await useApi(`/pegawai?${params.toString()}`);
    pegawaiList.value = res.data;
    totalData.value = res.total || 0;
    totalPages.value = Math.ceil(totalData.value / perPage.value) || 1;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const handleBulkDelete = async () => {
  if (!confirm(`Hapus ${selectedIds.value.length} data terpilih?`)) return;
  bulkLoading.value = true;
  try {
    await useApi(`/pegawai/bulk-action`, {
      method: 'POST',
      body: { action: 'delete', ids: selectedIds.value }
    });
    fetchList();
  } catch (e) {
    alert(e.data?.message || 'Gagal menghapus');
  } finally {
    bulkLoading.value = false;
  }
};

const handleBulkStatus = async () => {
  bulkLoading.value = true;
  try {
    await useApi(`/pegawai/bulk-action`, {
      method: 'POST',
      body: { action: 'status', ids: selectedIds.value, status: bulkStatus.value }
    });
    fetchList();
    bulkStatus.value = '';
  } catch (e) {
    alert(e.data?.message || 'Gagal mengubah status');
  } finally {
    bulkLoading.value = false;
  }
};

const changePage = (p) => {
  if (p >= 1 && p <= totalPages.value) {
    currentPage.value = p;
    fetchList();
  }
};

const changePerPage = () => {
  currentPage.value = 1;
  fetchList();
};

onMounted(async () => {
  try {
    const md = await useApi('/master');
    masterJabatan.value = md.filter(m => m.tipe === 'jabatan');
  } catch(e) {}
  fetchList();
});
</script>

<style scoped>
.cursor-pointer { cursor: pointer; user-select: none; }
.cursor-pointer:hover { background-color: rgba(0,0,0,0.05); }
</style>
