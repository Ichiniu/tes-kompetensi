<template>
  <NuxtLayout name="default">
    <div class="row g-3">
      <div class="col-lg-9 mx-auto">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Detail Hak Akses — {{ roleName }}</h3>
              <p class="text-secondary mb-0 small">Hak akses bersifat read-only. Perubahan hanya dapat dilakukan langsung di database.</p>
            </div>
          </div>
          <div class="card-body">
            <!-- Form -->
            <div class="mb-3">
              <label class="form-label required">Nama Role</label>
              <input type="text" class="form-control" :value="roleData.nama_role" disabled>
            </div>
            <div class="mb-4">
              <label class="form-label required">Deskripsi</label>
              <textarea class="form-control" rows="3" disabled>{{ roleData.deskripsi }}</textarea>
            </div>

            <!-- Table -->
            <div class="table-responsive border rounded">
              <table class="table table-vcenter table-striped mb-0">
                <thead>
                  <tr>
                    <th>Modul/Fitur ↕</th>
                    <th class="text-center">Akses</th>
                    <th class="text-center">Create</th>
                    <th class="text-center">Read</th>
                    <th class="text-center">Update</th>
                    <th class="text-center">Delete</th>
                  </tr>
                </thead>
              <tbody>
                <tr v-if="loading"><td colspan="6" class="text-center py-4">Loading...</td></tr>
                <tr v-for="(p, i) in permissions" :key="i" v-else>
                  <td>{{ p.modul_fitur }}</td>
                  <td class="text-center">
                    <span v-if="p.akses" class="text-success fw-bold">✓</span>
                    <span v-else class="text-danger fw-bold">✗</span>
                  </td>
                  <td class="text-center">
                    <span v-if="p.create" class="text-success fw-bold">✓</span>
                    <span v-else class="text-danger fw-bold">✗</span>
                  </td>
                  <td class="text-center">
                    <span v-if="p.modul_fitur === 'Login/Logout' && (p.read === 'All' || p.read === 'Yes')">Y</span>
                    <span v-else-if="p.modul_fitur === 'Dashboard' && p.read === 'All'">Sesuai Role</span>
                    <span v-else>{{ p.read || 'No' }}</span>
                  </td>
                  <td class="text-center">{{ p.update || 'No' }}</td>
                  <td class="text-center">
                    <span v-if="roleName === 'Superadmin' && p.modul_fitur === 'Kelola User' && (p.delete === 'All' || p.delete === 'Except Self')">
                      CRUD, kecuali<br>menghapus data dirinya
                    </span>
                    <span v-else-if="roleName === 'Admin HRD' && p.modul_fitur === 'Modul Data Pegawai' && (p.delete === 'All' || p.delete === 'Except Superadmin')">
                      CRUD, kecuali menghapus<br>data pegawai superadmin
                    </span>
                    <span v-else>{{ p.delete || 'No' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </div>
          <div class="card-footer d-flex">
            <button type="button" class="btn btn-link" @click="router.push('/pengaturan/role')">← Kembali</button>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from '#app';
import { useApi } from '~/composables/useApi';

definePageMeta({ title: "Detail Hak Akses", layout: false });
useSeoMeta({ title: "Detail Hak Akses" });

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const roleData = ref({ nama_role: '', deskripsi: '' });
const roleName = ref('');
const permissions = ref([]);

const modules = [
  'Login/Logout',
  'Kelola Role',
  'Kelola User',
  'My Profile',
  'Dashboard',
  'Modul Data Pegawai',
  'Modul Tunjangan Transport',
  'Setting Tunjangan Transport',
  'Modul Log'
];

onMounted(async () => {
  try {
    const id = route.params.id;
    
    // Get role name
    const roles = await useApi('/role');
    const role = roles.find(r => String(r.id) === String(id));
    if (role) {
      roleData.value = role;
      roleName.value = role.nama_role;
    }

    // Get permissions
    const res = await useApi(`/role/${id}/permissions`);
    
    // Gabungkan dengan urutan modul default agar selalu tampil
    permissions.value = modules.map(m => {
      const existing = res.find(r => r.modul_fitur === m);
      return existing || {
        modul_fitur: m,
        akses: false,
        create: false,
        read: 'No',
        update: 'No',
        delete: 'No'
      };
    });

    // Sort array by Modul/Fitur (A-Z) to satisfy 'sortable' requirement simply
    // Actually keep the PRD order, so do not sort alphabetically
    // permissions.value.sort((a, b) => a.modul_fitur.localeCompare(b.modul_fitur));
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>
