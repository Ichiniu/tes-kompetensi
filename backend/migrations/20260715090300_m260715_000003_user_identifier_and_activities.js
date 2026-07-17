/**
 * Migration: Tambah kolom identifier, status ke tabel user
 * dan kolom modul, aksi, keterangan, tanggal, id_user ke tabel activities
 */
exports.up = async function(knex) {
  // Tambah kolom ke tabel user
  const hasIdentifier = await knex.schema.hasColumn('user', 'identifier');
  if (!hasIdentifier) {
    await knex.schema.alterTable('user', table => {
      table.string('identifier', 150).nullable();
      table.string('status', 20).defaultTo('aktif');
    });
    // Copy nilai username ke identifier untuk data existing
    await knex.raw('UPDATE "user" SET identifier = username');
  }

  // Perkuat tabel activities
  const hasModul = await knex.schema.hasColumn('activities', 'modul');
  if (!hasModul) {
    await knex.schema.alterTable('activities', table => {
      table.string('modul', 100).nullable();
      table.string('aksi', 20).nullable();
      table.text('keterangan').nullable();
      table.timestamp('tanggal').nullable();
      table.integer('id_user').unsigned().nullable();
    });
  }
};

exports.down = async function(knex) {
  const hasIdentifier = await knex.schema.hasColumn('user', 'identifier');
  if (hasIdentifier) {
    await knex.schema.alterTable('user', table => {
      table.dropColumn('identifier');
      table.dropColumn('status');
    });
  }

  const hasModul = await knex.schema.hasColumn('activities', 'modul');
  if (hasModul) {
    await knex.schema.alterTable('activities', table => {
      table.dropColumn('modul');
      table.dropColumn('aksi');
      table.dropColumn('keterangan');
      table.dropColumn('tanggal');
      table.dropColumn('id_user');
    });
  }
};
