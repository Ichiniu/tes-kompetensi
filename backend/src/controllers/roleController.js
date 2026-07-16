const db = require('../config/db');

exports.getRoles = async (req, res) => {
  try {
    const data = await db('user_role').select('*');
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPermissionsByRole = async (req, res) => {
  try {
    const data = await db('role_permission').where('id_role', req.params.id_role);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePermissions = async (req, res) => {
  try {
    const { id_role } = req.params;
    const { permissions } = req.body; // Array of { nama_modul, is_create, is_read, is_update, is_delete }

    await db.transaction(async (trx) => {
      // Clear existing
      await trx('role_permission').where({ id_role }).del();
      
      // Insert new
      if (permissions && permissions.length > 0) {
        const payload = permissions.map(p => ({
          id_role,
          nama_modul: p.nama_modul,
          is_create: p.is_create ? 1 : 0,
          is_read: p.is_read ? 1 : 0,
          is_update: p.is_update ? 1 : 0,
          is_delete: p.is_delete ? 1 : 0
        }));
        await trx('role_permission').insert(payload);
      }
    });

    res.json({ message: 'Permissions updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
