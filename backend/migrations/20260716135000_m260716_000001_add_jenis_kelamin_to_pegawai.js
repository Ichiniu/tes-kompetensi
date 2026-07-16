exports.up = function(knex) {
  return knex.schema.alterTable('pegawai', function(table) {
    table.string('jenis_kelamin', 15).nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('pegawai', function(table) {
    table.dropColumn('jenis_kelamin');
  });
};
