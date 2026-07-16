const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    let query = db('user')
      .leftJoin('pegawai', 'user.id_pegawai', 'pegawai.id')
      .leftJoin('user_role', 'user.id_role', 'user_role.id')
      .select('user.id', 'user.identifier', 'user.status', 'user.last_login', 'pegawai.nama_pegawai', 'user_role.nama_role as role', 'user.id_role', 'user.id_pegawai');

    if (search) {
      query.where('user.identifier', 'like', `%${search}%`)
           .orWhere('pegawai.nama_pegawai', 'like', `%${search}%`);
    }

    const data = await query.limit(limit).offset((page - 1) * limit);
    
    // Get total count
    let countQuery = db('user').leftJoin('pegawai', 'user.id_pegawai', 'pegawai.id');
    if (search) {
      countQuery.where('user.identifier', 'like', `%${search}%`).orWhere('pegawai.nama_pegawai', 'like', `%${search}%`);
    }
    const total = await countQuery.count('user.id as count').first();

    res.json({
      data,
      pagination: {
        total: total.count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const user = await db('user').where('id', req.params.id).first();
    if (!user) return res.status(404).json({ message: 'User not found' });
    delete user.password;
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    let { identifier, password, id_pegawai, id_role, status } = req.body;
    
    // Validasi & Format Username
    if (!identifier) return res.status(400).json({ message: 'Username wajib diisi' });
    identifier = String(identifier).toLowerCase().replace(/\s/g, '');
    if (identifier.length < 6) return res.status(400).json({ message: 'Username minimal 6 karakter' });
    if (!/^[a-z0-9]+$/.test(identifier)) return res.status(400).json({ message: 'Username hanya boleh huruf kecil dan angka' });
    if (!/[0-9]/.test(identifier)) return res.status(400).json({ message: 'Username harus mengandung minimal 1 angka' });
    
    // Check if user exists
    const exists = await db('user').where({ identifier }).first();
    if (exists) return res.status(400).json({ message: 'Username/Email/NIP already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [id] = await db('user').insert({
      identifier,
      username: identifier,
      password_hash: hashedPassword,
      id_pegawai: id_pegawai || null,
      id_role,
      status: status || 'aktif'
    });

    res.status(201).json({ message: 'User created successfully', id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    let { identifier, password, id_pegawai, id_role, status } = req.body;

    // Validasi & Format Username
    if (!identifier) return res.status(400).json({ message: 'Username wajib diisi' });
    identifier = String(identifier).toLowerCase().replace(/\s/g, '');
    if (identifier.length < 6) return res.status(400).json({ message: 'Username minimal 6 karakter' });
    if (!/^[a-z0-9]+$/.test(identifier)) return res.status(400).json({ message: 'Username hanya boleh huruf kecil dan angka' });
    if (!/[0-9]/.test(identifier)) return res.status(400).json({ message: 'Username harus mengandung minimal 1 angka' });

    const updateData = { identifier, username: identifier, id_pegawai, id_role, status };

    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    await db('user').where('id', req.params.id).update(updateData);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    // Cannot delete own account
    if (req.params.id == req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    await db('user').where('id', req.params.id).del();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
