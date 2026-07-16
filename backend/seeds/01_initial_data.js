const bcrypt = require('bcrypt');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('activities').del();
  await knex('user').del();
  await knex('role_permission').del();
  await knex('user_role').del();
  await knex('pegawai_pendidikan').del();
  await knex('tunjangan_transport_detail').del();
  await knex('tunjangan_transport').del();
  await knex('setting_tunjangan_transport').del();
  await knex('pegawai').del();
  await knex('master_data').del();
  await knex('master_wilayah').del();

  // 1. master_data
  await knex('master_data').insert([
    { id: 1, nama: 'Manager', tipe: 'jabatan' },
    { id: 2, nama: 'Staf', tipe: 'jabatan' },
    { id: 3, nama: 'Magang', tipe: 'jabatan' },
    { id: 4, nama: 'Marketing', tipe: 'departemen' },
    { id: 5, nama: 'HRD', tipe: 'departemen' },
    { id: 6, nama: 'Production', tipe: 'departemen' },
    { id: 7, nama: 'Executive', tipe: 'departemen' },
    { id: 8, nama: 'Commissioner', tipe: 'departemen' }
  ]);

  // 2. master_wilayah
  await knex('master_wilayah').insert([
    { id: 1, kecamatan: 'Depok', kabupaten: 'Sleman', provinsi: 'DI Yogyakarta' },
    { id: 2, kecamatan: 'Mlati', kabupaten: 'Sleman', provinsi: 'DI Yogyakarta' },
    { id: 3, kecamatan: 'Gondokusuman', kabupaten: 'Yogyakarta', provinsi: 'DI Yogyakarta' }
  ]);

  // 3. user_role
  await knex('user_role').insert([
    { id: 1, nama_role: 'Superadmin', deskripsi: 'Administrator sistem dengan hak akses penuh' },
    { id: 2, nama_role: 'Manager HRD', deskripsi: 'Pimpinan HRD untuk melihat laporan' },
    { id: 3, nama_role: 'Admin HRD', deskripsi: 'Admin operasional HRD untuk kelola data' }
  ]);

  // 4. role_permission
  // Modul: Login/Logout (skipped as not directly managed by RBAC table usually, but we can add it)
  // PRD Matrix:
  // Superadmin: Kelola Role (R), Kelola User (CRUD), My Profile (RO, UO), Dashboard (R), Log (R)
  // Manager HRD: My Profile (RO, UO), Dashboard (R), Modul Data Pegawai (R), Modul Tunjangan Transport (RO)
  // Admin HRD: My Profile (RO, UO), Dashboard (R), Modul Data Pegawai (CRUD), Modul Tunjangan Transport (RO), Setting Tunjangan Transport (CRUD)
  
  await knex('role_permission').insert([
    // Superadmin
    { id_role: 1, modul_fitur: 'Login/Logout', akses: true, create: false, read: 'All', update: 'No', delete: 'No' },
    { id_role: 1, modul_fitur: 'Kelola Role', akses: true, create: false, read: 'All', update: 'No', delete: 'No' },
    { id_role: 1, modul_fitur: 'Kelola User', akses: true, create: true, read: 'All', update: 'All', delete: 'All' },
    { id_role: 1, modul_fitur: 'My Profile', akses: true, create: false, read: 'Own', update: 'Own', delete: 'No' },
    { id_role: 1, modul_fitur: 'Dashboard', akses: true, create: false, read: 'All', update: 'No', delete: 'No' },
    { id_role: 1, modul_fitur: 'Modul Log', akses: true, create: false, read: 'All', update: 'No', delete: 'No' },
    
    // Manager HRD
    { id_role: 2, modul_fitur: 'Login/Logout', akses: true, create: false, read: 'All', update: 'No', delete: 'No' },
    { id_role: 2, modul_fitur: 'My Profile', akses: true, create: false, read: 'Own', update: 'Own', delete: 'No' },
    { id_role: 2, modul_fitur: 'Dashboard', akses: true, create: false, read: 'All', update: 'No', delete: 'No' },
    { id_role: 2, modul_fitur: 'Modul Data Pegawai', akses: true, create: false, read: 'All', update: 'No', delete: 'No' },
    { id_role: 2, modul_fitur: 'Modul Tunjangan Transport', akses: true, create: false, read: 'Own', update: 'No', delete: 'No' },
    
    // Admin HRD
    { id_role: 3, modul_fitur: 'Login/Logout', akses: true, create: false, read: 'All', update: 'No', delete: 'No' },
    { id_role: 3, modul_fitur: 'My Profile', akses: true, create: false, read: 'Own', update: 'Own', delete: 'No' },
    { id_role: 3, modul_fitur: 'Dashboard', akses: true, create: false, read: 'All', update: 'No', delete: 'No' },
    { id_role: 3, modul_fitur: 'Modul Data Pegawai', akses: true, create: true, read: 'All', update: 'All', delete: 'All' },
    { id_role: 3, modul_fitur: 'Modul Tunjangan Transport', akses: true, create: false, read: 'Own', update: 'No', delete: 'No' },
    { id_role: 3, modul_fitur: 'Setting Tunjangan Transport', akses: true, create: true, read: 'All', update: 'All', delete: 'All' }
  ]);

  // 5. pegawai
  await knex('pegawai').insert([
    {
      id: 1,
      nip: 'SA001',
      nama_pegawai: 'Super Admin',
      email: 'admin@jmc.co.id',
      nomor_hp: '081234567890',
      id_kecamatan: 1,
      jarak_rumah_kantor: 10,
      tanggal_masuk: '2020-01-01',
      id_jabatan: 1, // Manager
      id_departemen: 7, // Executive
      status_kontrak: 'PKWTT',
      status: 'Aktif',
      jenis_kelamin: 'Laki-laki'
    }
  ]);

  // 6. user
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  await knex('user').insert([
    {
      id: 1,
      id_role: 1,
      id_pegawai: 1,
      username: 'superadmin',
      identifier: 'superadmin',
      password_hash: passwordHash,
      nama: 'Super Admin',
      email: 'admin@jmc.co.id',
      status: 'aktif'
    }
  ]);

  // 7. setting_tunjangan_transport
  await knex('setting_tunjangan_transport').insert([
    {
      base_fare: 1000.00,
      min_km: 5.00,
      max_km: 25.00,
      berlaku_mulai: '2020-01-01',
      created_by: 1
    }
  ]);
};
