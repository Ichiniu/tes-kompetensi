<template>
  <NuxtLayout name="default">
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Manajemen Role</h3>
      </div>
      <div class="table-responsive card-body p-0">
        <table class="table table-vcenter">
          <thead>
            <tr>
              <th width="5">No</th>
              <th>Role</th>
              <th>Deskripsi</th>
              <th width="15" class="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="4" class="text-center">Loading...</td></tr>
            <tr v-for="(item, index) in listRole" :key="item.id" v-else>
              <td class="text-center">{{ index + 1 }}</td>
              <td>{{ item.nama_role }}</td>
              <td>{{ item.deskripsi || '-' }}</td>
              <td class="text-nowrap text-center">
                <NuxtLink :to="`/pengaturan/role/${item.id}/permissions`" class="btn btn-sm btn-info" title="Hak Akses">
                  <IconEye size="18" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApi } from '~/composables/useApi';
import { IconEye } from '@tabler/icons-vue';

definePageMeta({ title: "Role", layout: false });
useSeoMeta({ title: "Role" });

const listRole = ref([]);
const loading = ref(false);

const fetchRoles = async () => {
  loading.value = true;
  try {
    listRole.value = await useApi('/role');
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchRoles();
});
</script>
