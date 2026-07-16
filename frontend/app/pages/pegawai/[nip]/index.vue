<template>
  <div class="row g-3">
    <div class="col-12 text-center" v-if="loading">
      <div class="spinner-border text-primary mt-5" role="status"></div>
      <div class="mt-2 text-muted">Memuat data pegawai...</div>
    </div>
    <div class="col-12 text-center py-5" v-else-if="!pegawai">
      <div class="text-muted">Data pegawai tidak ditemukan.</div>
      <button class="btn btn-outline-secondary mt-3" @click="goBack()">Kembali</button>
    </div>
    <template v-else>
      <!-- Row 1: Data Diri & Data Kepegawaian -->
      <div class="col-lg-8">
        <div class="card h-100">
          <div class="card-header">
            <h3 class="card-title">Data Diri</h3>
          </div>
          <div class="card-body">
            <div class="row g-4">
              <div class="col-12">
                <div class="row align-items-center">
                  <!-- Foto -->
                  <div class="col-auto">
                    <img
                      :src="pegawai.foto_pegawai ? `${apiBase}/pegawai/${pegawai.id}/foto` : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iYmxhY2siPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEyIiAvPjxwYXRoIGZpbGw9IndoaXRlIiBkPSJNMTIgMTJjMi4yMSAwIDQtMS43OSA0LTRzLTEuNzktNC00LTQtNCAxLjc5LTQgNCAxLjc5IDQgNCA0em0wIDJjLTIuNjcgMC04IDEuMzQtOCA0djJoMTZ2LTJjMC0yLjY2LTUuMzMtNC04LTR6Ii8+PC9zdmc+'"
                      alt="Foto Profil"
                      class="foto-profil mb-2 rounded-circle shadow-sm"
                      style="width: 100px; height: 100px; object-fit: cover; border: 2px solid #E5E5E8; padding: 2px; background-color: #f7f7f8;"
                    />
                  </div>
                  <div class="col">
                    <div class="datagrid-item mb-2">
                      <div class="datagrid-title text-muted text-uppercase" style="font-size: 0.75rem;">NIP</div>
                      <div class="datagrid-content fw-bold fs-3" style="color: var(--accent);">{{ pegawai.nip }}</div>
                    </div>
                    <div class="datagrid-item">
                      <div class="datagrid-title text-muted text-uppercase" style="font-size: 0.75rem;">Nama Lengkap</div>
                      <div class="datagrid-content fw-semibold fs-4">{{ pegawai.nama_pegawai }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-md-6">
                <div class="datagrid-item">
                  <div class="datagrid-title text-muted">Email</div>
                  <div class="datagrid-content">{{ pegawai.email || '-' }}</div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="datagrid-item">
                  <div class="datagrid-title text-muted">Nomor HP</div>
                  <div class="datagrid-content">{{ pegawai.nomor_hp || pegawai.no_hp || '-' }}</div>
                </div>
              </div>

              <div class="col-md-4">
                <div class="datagrid-item">
                  <div class="datagrid-title text-muted">Tempat Lahir</div>
                  <div class="datagrid-content">{{ pegawai.tempat_lahir || '-' }}</div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="datagrid-item">
                  <div class="datagrid-title text-muted">Tanggal Lahir</div>
                  <div class="datagrid-content">{{ pegawai.tanggal_lahir ? new Date(Number(pegawai.tanggal_lahir)).toLocaleDateString('id-ID') : '-' }}</div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="datagrid-item">
                  <div class="datagrid-title text-muted">Usia</div>
                  <div class="datagrid-content">{{ age }} tahun</div>
                </div>
              </div>

              <div class="col-md-4">
                <div class="datagrid-item">
                  <div class="datagrid-title text-muted">Jenis Kelamin</div>
                  <div class="datagrid-content">{{ pegawai.jenis_kelamin || '-' }}</div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="datagrid-item">
                  <div class="datagrid-title text-muted">Status Pernikahan</div>
                  <div class="datagrid-content text-capitalize">{{ pegawai.status_kawin || pegawai.status_pernikahan || '-' }}</div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="datagrid-item">
                  <div class="datagrid-title text-muted">Jumlah Anak</div>
                  <div class="datagrid-content">{{ pegawai.jumlah_anak || 0 }}</div>
                </div>
              </div>

              <div class="col-12">
                <div class="datagrid-item">
                  <div class="datagrid-title text-muted">Alamat Lengkap</div>
                  <div class="datagrid-content bg-light p-2 rounded mt-1 border">
                    {{ pegawai.alamat_lengkap || '-' }}<br/>
                    <small class="text-muted" v-if="pegawai.id_kecamatan">ID Kecamatan: {{ pegawai.id_kecamatan }}</small>
                  </div>
                </div>
              </div>

              <div class="col-md-6">
                <div class="datagrid-item">
                  <div class="datagrid-title text-muted">Jarak Rumah - Kantor</div>
                  <div class="datagrid-content">
                    <span v-if="pegawai.jarak_rumah_kantor">{{ pegawai.jarak_rumah_kantor }} KM</span>
                    <span v-else>-</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <div class="card h-100">
          <div class="card-header">
            <h3 class="card-title">Data Kepegawaian</h3>
          </div>
          <div class="card-body">
            <div class="row g-4">
              <div class="col-12">
                <div class="datagrid-item">
                  <div class="datagrid-title text-muted">Status Karyawan</div>
                  <div class="datagrid-content">
                    <span class="badge" :class="pegawai.status === 'Aktif' ? 'bg-success' : 'bg-danger'">
                      {{ pegawai.status || 'Aktif' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="col-12">
                <div class="datagrid-item">
                  <div class="datagrid-title text-muted">Tanggal Masuk</div>
                  <div class="datagrid-content">{{ pegawai.tanggal_masuk ? new Date(Number(pegawai.tanggal_masuk)).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'}) : '-' }}</div>
                </div>
              </div>

              <div class="col-12">
                <div class="datagrid-item">
                  <div class="datagrid-title text-muted">Jabatan</div>
                  <div class="datagrid-content fw-semibold">{{ pegawai.nama_jabatan || '-' }}</div>
                </div>
              </div>

              <div class="col-12">
                <div class="datagrid-item">
                  <div class="datagrid-title text-muted">Departemen</div>
                  <div class="datagrid-content">{{ pegawai.nama_departemen || pegawai.departemen || '-' }}</div>
                </div>
              </div>

              <div class="col-12">
                <div class="datagrid-item">
                  <div class="datagrid-title text-muted">Status Kontrak</div>
                  <div class="datagrid-content">
                    <span class="badge bg-primary-lt">{{ pegawai.status_kontrak || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 2: Pendidikan -->
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Riwayat Pendidikan</h3>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-vcenter table-borderless table-striped card-table">
                <thead class="bg-light">
                  <tr>
                    <th>Jenjang Pendidikan</th>
                    <th>Nama Sekolah / Institusi</th>
                    <th>Tahun Lulus</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(edu, i) in pendidikan" :key="i">
                    <td><span class="badge bg-secondary-lt">{{ edu.jenjang || edu.tingkat_pendidikan }}</span></td>
                    <td class="fw-medium">{{ edu.nama_institusi || edu.nama_sekolah }}</td>
                    <td class="text-muted">{{ edu.tahun_lulus }}</td>
                  </tr>
                  <tr v-if="!pendidikan.length">
                    <td colspan="3" class="text-center text-muted py-4">Belum ada data riwayat pendidikan.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="card-footer d-flex justify-content-end">
            <button class="btn btn-primary" @click="goBack()">
              Kembali ke Daftar
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from '#app';
import { useApi } from '~/composables/useApi';

definePageMeta({ title: "Detail Pegawai" });
useSeoMeta({ title: "Detail Pegawai" });

const route = useRoute();
const router = useRouter();
const goBack = () => router.push('/pegawai');

const nip = route.params.nip;

const runtimeConfig = useRuntimeConfig();
const apiBase = runtimeConfig.public.apiBaseUrl || 'http://localhost:3001/api';

const loading = ref(true);
const pegawaiData = ref(null);

onMounted(async () => {
  try {
    const nipStr = route.params.nip;
    if (!nipStr) throw new Error("NIP is empty");
    
    // We use $fetch directly to avoid context loss in Nuxt 3 when calling useApi inside onMounted
    const searchRes = await $fetch(`${apiBase}/pegawai?search=${encodeURIComponent(nipStr)}&limit=1`, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });
    
    if (searchRes && searchRes.data && searchRes.data.length > 0) {
      const p = searchRes.data[0];
      const detailRes = await $fetch(`${apiBase}/pegawai/${p.id}`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      pegawaiData.value = { ...p, pendidikan: detailRes.pendidikan || [] };
    }
  } catch (e) {
    console.error("Error fetching detail pegawai:", e);
  } finally {
    loading.value = false;
  }
});

const pegawai = computed(() => pegawaiData.value || null);
const pendidikan = computed(() => pegawaiData.value?.pendidikan || []);

const age = computed(() => {
  if (!pegawai.value?.tanggal_lahir) return 0;
  const birth = new Date(pegawai.value.tanggal_lahir);
  const diff = Date.now() - birth.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
});
</script>

<style scoped>
.foto-ptofil {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}
</style>
