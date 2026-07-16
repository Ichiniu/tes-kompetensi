const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

const emitNewLog = async (req, insertedId) => {
  if (req.app.locals.io) {
    try {
      const logData = await db('activities')
        .leftJoin('user', 'activities.id_user', 'user.id')
        .select(
          'activities.id', 'activities.modul', 'activities.aksi',
          'activities.keterangan', 'activities.tanggal', 'user.identifier as nama_user'
        )
        .where('activities.id', insertedId)
        .first();
      req.app.locals.io.to('superadmin-room').emit('new_log', logData);
    } catch (e) {
      console.error('Error emitting new_log:', e);
    }
  }
};

const disconnectUserSockets = async (io, userId) => {
  if (!io) return;
  try {
    const sockets = await io.fetchSockets();
    for (const socket of sockets) {
      if (socket.user && socket.user.id === userId) {
        socket.disconnect(true);
      }
    }
  } catch (e) {
    console.error('Error disconnecting sockets:', e);
  }
};

const captchaStore = new Map(); // Simple in-memory store for captchas

exports.generateCaptcha = (req, res) => {
  // Exclude ambiguous characters: 1, l, I, 0, O
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  const id = Date.now().toString();
  captchaStore.set(id, code);

  // Delete captcha after 5 minutes
  setTimeout(() => {
    captchaStore.delete(id);
  }, 5 * 60 * 1000);

  res.json({
    captchaId: id,
    question: code
  });
};

exports.login = async (req, res) => {
  try {
    const { identifier, password, captchaId, captchaAnswer, rememberMe } = req.body;

    if (!identifier || !password || !captchaId || !captchaAnswer) {
      return res.status(400).json({ message: 'Semua field wajib diisi' });
    }

    // Verify captcha
    const expectedAnswer = captchaStore.get(captchaId);
    if (!expectedAnswer || expectedAnswer !== captchaAnswer) {
      return res.status(400).json({ message: 'Captcha salah atau sudah kedaluwarsa' });
    }

    // Find user by username, email, or nomor_hp
    const user = await db('user')
      .leftJoin('pegawai', 'user.id_pegawai', 'pegawai.id')
      .where('user.username', identifier)
      .orWhere('user.email', identifier)
      .orWhere('pegawai.nomor_hp', identifier)
      .select('user.*')
      .first();

    if (!user) {
      return res.status(401).json({ message: 'Kredensial salah' });
    }

    if (user.disabled) {
      return res.status(403).json({ message: 'Akun Anda dinonaktifkan' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Kredensial salah' });
    }

    captchaStore.delete(captchaId); // Remove used captcha

    // Session idle timeout is handled by the frontend (3 minutes).
    // The token itself is valid longer so active users don't get forcefully disconnected.
    const expiresIn = rememberMe ? '30d' : '12h';

    const token = jwt.sign(
      { id: user.id, id_role: user.id_role, id_pegawai: user.id_pegawai, identifier: user.identifier },
      JWT_SECRET,
      { expiresIn }
    );

    res.cookie('token', token, { 
      httpOnly: true, 
      secure: false, // Should be true in production with HTTPS
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 3 * 60 * 1000
    });

    // Update last login
    await db('user').where('id', user.id).update({ last_login: db.fn.now() });

    // Log activity
    const [insertedId] = await db('activities').insert({
      id_user: user.id,
      modul: 'Autentikasi',
      aksi: 'login',
      keterangan: `${user.identifier} berhasil login ke dalam sistem`,
      tanggal: new Date()
    });
    await emitNewLog(req, insertedId);

    res.json({
      message: 'Login berhasil',
      user: {
        id: user.id,
        username: user.username,
        nama: user.nama,
        id_role: user.id_role
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan internal server' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await db('user')
      .leftJoin('user_role', 'user.id_role', 'user_role.id')
      .leftJoin('pegawai', 'user.id_pegawai', 'pegawai.id')
      .select(
        'user.id', 'user.identifier', 'user.id_role', 'user.id_pegawai',
        'user_role.nama_role as role',
        'pegawai.nama_pegawai', 'pegawai.email', 'pegawai.nomor_hp as no_hp',
        'pegawai.alamat_lengkap'
      )
      .where('user.id', req.user.id)
      .first();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error server' });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { nama_pegawai, email, no_hp, alamat_lengkap, password } = req.body;
    
    // Update user table
    const userUpdate = { updated_at: new Date() };
    if (nama_pegawai) userUpdate.nama = nama_pegawai;
    if (email) userUpdate.email = email;
    if (password) {
      userUpdate.password_hash = await bcrypt.hash(password, 10);
    }
    await db('user').where('id', req.user.id).update(userUpdate);
    
    // Update pegawai data if this user is linked to a pegawai
    if (req.user.id_pegawai) {
      const updateData = {};
      if (nama_pegawai) updateData.nama_pegawai = nama_pegawai;
      if (email) updateData.email = email;
      if (no_hp) updateData.nomor_hp = no_hp;
      if (alamat_lengkap) updateData.alamat_lengkap = alamat_lengkap;
      if (Object.keys(updateData).length > 0) {
        await db('pegawai').where('id', req.user.id_pegawai).update(updateData);
      }
    }
    
    // Log activity manually for profile update
    try {
      const [insertedId] = await db('activities').insert({
        id_user: req.user.id,
        modul: 'My Profile',
        aksi: 'update',
        keterangan: `User ${req.user.identifier} updated their profile`,
        tanggal: new Date()
      });
      await emitNewLog(req, insertedId);
    } catch (logErr) {
      console.error('Gagal mencatat log My Profile:', logErr);
    }
    
    res.json({ message: 'Profil berhasil diperbarui' });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT' || error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email atau Nomor HP sudah terdaftar' });
    }
    console.error(error);
    res.status(500).json({ message: 'Gagal menyimpan perubahan profil' });
  }
};

exports.logout = async (req, res) => {
  let userPayload = req.user;
  
  if (!userPayload) {
    // Coba ambil token dari cookie atau header jika middleware authenticateToken tidak dipakai
    const token = req.cookies?.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (token) {
      try {
        userPayload = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        // Abaikan jika token kedaluwarsa, yang penting kita coba decode
        userPayload = jwt.decode(token);
      }
    }
  }

  if (userPayload && userPayload.id) {
    try {
      const [insertedId] = await db('activities').insert({
        id_user: userPayload.id,
        modul: 'Autentikasi',
        aksi: 'logout',
        keterangan: `${userPayload.identifier || 'User'} berhasil logout dari sistem`,
        tanggal: new Date()
      });
      await emitNewLog(req, insertedId);
      await disconnectUserSockets(req.app.locals.io, userPayload.id);
    } catch (e) {
      console.error('Gagal mencatat log logout:', e);
    }
  }
  res.clearCookie('token');
  res.json({ message: 'Logout berhasil' });
};

