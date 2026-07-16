const db = require('../config/db');

exports.getJabatanDepartemen = async (req, res) => {
  try {
    const jabatan = await db('master_data').where('tipe', 'jabatan');
    const departemen = await db('master_data').where('tipe', 'departemen');
    res.json({ jabatan, departemen });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching master data' });
  }
};

exports.autocompleteWilayah = async (req, res) => {
  try {
    const { q } = req.query;
    let query = db('master_wilayah');
    if (q) {
      query = query.where('kecamatan', 'like', `%${q}%`)
                   .orWhere('kabupaten', 'like', `%${q}%`)
                   .orWhere('provinsi', 'like', `%${q}%`);
    }
    const wilayah = await query.limit(10);
    res.json(wilayah);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wilayah' });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const roles = await db('user_role');
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching roles' });
  }
};
