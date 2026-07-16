/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('setting_tunjangan_transport', table => {
      table.increments('id').primary();
      table.decimal('base_fare', 12, 2);
      table.decimal('min_km', 5, 2);
      table.decimal('max_km', 5, 2);
      table.date('berlaku_mulai');
      table.integer('created_by').unsigned();
      table.timestamps(true, true);

      table.foreign('created_by').references('id').inTable('user').onDelete('SET NULL').onUpdate('CASCADE');
    })
    .createTable('tunjangan_transport', table => {
      table.increments('id').primary();
      table.integer('bulan', 2);
      table.integer('tahun', 4);
      table.integer('total_penerima');
      table.decimal('total_tunjangan', 15, 2);
      table.enum('status_hitung', ['belum', 'sudah']).defaultTo('belum');
      table.timestamp('dihitung_pada');
      table.integer('dihitung_oleh').unsigned();

      table.unique(['bulan', 'tahun']);
      table.foreign('dihitung_oleh').references('id').inTable('user').onDelete('SET NULL').onUpdate('CASCADE');
    })
    .createTable('tunjangan_transport_detail', table => {
      table.increments('id').primary();
      table.integer('id_tunjangan_transport').unsigned();
      table.integer('id_pegawai').unsigned();
      table.decimal('km_dihitung', 5, 2);
      table.integer('hari_kerja', 2);
      table.decimal('base_fare_snapshot', 12, 2);
      table.decimal('nominal', 15, 2);
      table.boolean('eligible');
      table.string('keterangan', 255);

      table.foreign('id_tunjangan_transport').references('id').inTable('tunjangan_transport').onDelete('CASCADE').onUpdate('CASCADE');
      table.foreign('id_pegawai').references('id').inTable('pegawai').onDelete('CASCADE').onUpdate('CASCADE');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('tunjangan_transport_detail')
    .dropTableIfExists('tunjangan_transport')
    .dropTableIfExists('setting_tunjangan_transport');
};
