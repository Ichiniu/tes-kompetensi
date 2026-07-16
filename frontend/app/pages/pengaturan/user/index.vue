<template>
  <NuxtLayout name="default">
    <template #actions>
      <NuxtLink to="/pengaturan/user/form" class="btn btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-plus" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Tambah
      </NuxtLink>
    </template>
    <div class="card">
      <div class="card-header">
        <div class="d-flex gap-2 ms-auto">
          <!-- Search -->
          <div class="input-group" style="width: 250px">
            <input
              v-model="searchQuery"
              @keyup.enter="fetchList"
              type="text"
              class="form-control"
              placeholder="Cari Username/Pegawai ..."
            />
            <button class="btn" type="button" @click="fetchList">
              Cari
            </button>
          </div>
        </div>
      </div>
      <div class="table-responsive card-body p-0">
        <table class="table table-vcenter">
          <thead>
            <tr>
              <th width="5">No</th>
              <th>Nama</th>
              <th>Username</th>
              <th>Status</th>
              <th width="15" class="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="5" class="text-center">Loading...</td></tr>
            <tr v-else-if="userList.length === 0"><td colspan="5" class="text-center">Belum ada data user</td></tr>
            <tr v-for="(item, index) in userList" :key="item.id" v-else>
              <td class="text-center">{{ (currentPage - 1) * 10 + index + 1 }}</td>
              <td>{{ item.nama_pegawai || '-' }}</td>
              <td>{{ item.identifier }}</td>
              <td>
                <span v-if="item.status === 'aktif'" class="text-success fw-bold">✓ Aktif</span>
                <span v-else class="text-danger fw-bold">✗ Nonaktif</span>
              </td>
              <td class="text-nowrap text-center">
                <div class="d-flex justify-content-center gap-1">
                  <NuxtLink :to="`/pengaturan/user/form?id=${item.id}`" class="btn btn-sm btn-primary" title="Edit">
                    <IconPencil size="18" />
                  </NuxtLink>
                  <a href="#" @click.prevent="confirmDelete(item)" class="btn btn-sm btn-danger" title="Hapus">
                    <IconTrash size="18" />
                  </a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card-footer d-flex align-items-center">
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

      <!-- Modal Hapus -->
      <div class="modal modal-blur fade" id="modal-hapus" tabindex="-1" :class="{ show: showDeleteModal }" :style="{ display: showDeleteModal ? 'block' : 'none' }">
        <div class="modal-dialog modal-sm modal-dialog-centered" role="document">
          <div class="modal-content">
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
            <div class="modal-status bg-danger"></div>
            <div class="modal-body text-center py-4">
              <h3 class="mb-1">Hapus Data</h3>
              <div class="text-secondary">
                Apakah kamu ingin menghapus akun {{ selectedUser?.identifier }} ?
              </div>
            </div>
            <div class="modal-footer">
              <div class="w-100">
                <div class="row">
                  <div class="col">
                    <button class="btn btn-white w-100" @click="showDeleteModal = false">Batal</button>
                  </div>
                  <div class="col">
                    <button class="btn btn-danger w-100" @click="handleDelete" :disabled="deleteLoading">
                      {{ deleteLoading ? 'Menghapus...' : 'Hapus' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showDeleteModal" class="modal-backdrop fade show"></div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApi } from '~/composables/useApi';
import { IconPencil, IconTrash } from '@tabler/icons-vue';

definePageMeta({ title: "Manajemen User", layout: false });
useSeoMeta({ title: "Manajemen User" });

const userList = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const currentPage = ref(1);
const totalPages = ref(1);

const showDeleteModal = ref(false);
const selectedUser = ref(null);
const deleteLoading = ref(false);

const fetchList = async () => {
  loading.value = true;
  try {
    let url = `/user?page=${currentPage.value}&limit=10`;
    if (searchQuery.value) {
      url += `&search=${encodeURIComponent(searchQuery.value)}`;
    }
    const res = await useApi(url);
    userList.value = res.data;
    totalPages.value = res.pagination.totalPages || 1;
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

const confirmDelete = (item) => {
  selectedUser.value = item;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!selectedUser.value) return;
  deleteLoading.value = true;
  try {
    await useApi(`/user/${selectedUser.value.id}`, { method: 'DELETE' });
    showDeleteModal.value = false;
    fetchList();
  } catch (e) {
    alert(e.data?.message || 'Gagal menghapus data');
  } finally {
    deleteLoading.value = false;
  }
};

onMounted(() => {
  fetchList();
});
</script>
