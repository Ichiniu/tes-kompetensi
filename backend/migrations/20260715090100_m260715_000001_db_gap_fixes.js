/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .alterTable('pegawai', table => {
      table.enum('status_kontrak', ['PKWTT', 'PKWT', 'Magang']).nullable();
    })
    .alterTable('user_role', table => {
      table.text('deskripsi').nullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .alterTable('pegawai', table => {
      table.dropColumn('status_kontrak');
    })
    .alterTable('user_role', table => {
      table.dropColumn('deskripsi');
    });
};
