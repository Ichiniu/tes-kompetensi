/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('master_data', table => {
      table.increments('id').primary();
      table.string('nama', 100);
      table.string('tipe', 50);
    })
    .createTable('master_wilayah', table => {
      table.increments('id').primary();
      table.string('kecamatan', 100).index('idx_kecamatan');
      table.string('kabupaten', 100);
      table.string('provinsi', 100);
    })
    .createTable('pegawai', table => {
      table.increments('id').primary();
      table.string('foto_pegawai', 255);
      table.string('nip', 30).unique();
      table.string('nama_pegawai', 255);
      table.string('email', 255).unique();
      table.string('nomor_hp', 20);
      table.string('tempat_lahir', 100);
      table.integer('id_kecamatan').unsigned();
      table.text('alamat_lengkap');
      table.integer('jarak_rumah_kantor').unsigned();
      table.date('tanggal_lahir');
      // For SQLite compatibility, enums are mapped to strings. Knex handles this mostly gracefully, but in SQLite it creates a plain column.
      table.enum('status_kawin', ['kawin', 'tidak kawin']);
      table.integer('jumlah_anak').unsigned().defaultTo(0);
      table.date('tanggal_masuk');
      table.integer('id_jabatan').unsigned();
      table.integer('id_departemen').unsigned();
      table.integer('usia');
      table.enum('status', ['Aktif', 'Nonaktif']).defaultTo('Aktif');
      table.timestamps(true, true);

      table.foreign('id_jabatan').references('id').inTable('master_data').onUpdate('CASCADE');
      table.foreign('id_departemen').references('id').inTable('master_data').onUpdate('CASCADE');
      table.foreign('id_kecamatan').references('id').inTable('master_wilayah').onUpdate('CASCADE');
    })
    .createTable('pegawai_pendidikan', table => {
      table.increments('id').primary();
      table.integer('id_pegawai').unsigned();
      table.string('tingkat_pendidikan', 50);
      table.string('nama_sekolah', 255);
      table.integer('tahun_lulus');

      table.foreign('id_pegawai').references('id').inTable('pegawai').onDelete('CASCADE').onUpdate('CASCADE');
    })
    .createTable('user_role', table => {
      table.increments('id').primary();
      table.string('nama_role', 100);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('role_permission', table => {
      table.increments('id').primary();
      table.integer('id_role').unsigned();
      table.string('modul_fitur', 100);
      table.boolean('akses').defaultTo(false);
      table.boolean('create').defaultTo(false);
      table.enum('read', ['All', 'Own', 'No']).defaultTo('No');
      table.enum('update', ['All', 'Own', 'No']).defaultTo('No');
      table.enum('delete', ['All', 'Own', 'No']).defaultTo('No');

      table.foreign('id_role').references('id').inTable('user_role').onDelete('CASCADE').onUpdate('CASCADE');
    })
    .createTable('user', table => {
      table.increments('id').primary();
      table.integer('id_role').unsigned();
      table.integer('id_pegawai').unsigned();
      table.string('username', 100).unique();
      table.string('password_hash', 255);
      table.string('nama', 255);
      table.string('email', 255);
      table.string('last_session', 255);
      table.timestamp('last_login');
      table.timestamps(true, true);
      table.boolean('disabled').defaultTo(false);

      table.foreign('id_role').references('id').inTable('user_role').onUpdate('CASCADE');
      table.foreign('id_pegawai').references('id').inTable('pegawai').onDelete('SET NULL').onUpdate('CASCADE');
    })
    .createTable('activities', table => {
      table.increments('id').primary();
      table.string('title', 255);
      table.text('content');
      table.string('ua', 256);
      table.string('ip', 64);
      table.text('url');
      table.string('browser', 64);
      table.string('platform', 64);
      table.integer('created_by').unsigned();
      table.integer('updated_by').unsigned();
      table.timestamps(true, true);

      table.foreign('created_by').references('id').inTable('user').onDelete('SET NULL').onUpdate('CASCADE');
      table.foreign('updated_by').references('id').inTable('user').onDelete('SET NULL').onUpdate('CASCADE');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('activities')
    .dropTableIfExists('user')
    .dropTableIfExists('role_permission')
    .dropTableIfExists('user_role')
    .dropTableIfExists('pegawai_pendidikan')
    .dropTableIfExists('pegawai')
    .dropTableIfExists('master_wilayah')
    .dropTableIfExists('master_data');
};
