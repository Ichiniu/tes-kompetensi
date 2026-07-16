const db = require('../config/db');

const logMiddleware = (req, res, next) => {
  // Exclude non-essential endpoints
  if (req.path.startsWith('/api-docs') || req.path === '/api/health' || req.path === '/api/csrf' || req.path.startsWith('/api/auth')) {
    return next();
  }

  // Determine method/action
  let action = 'read';
  if (req.method === 'POST') action = 'create';
  else if (req.method === 'PUT' || req.method === 'PATCH') action = 'update';
  else if (req.method === 'DELETE') action = 'delete';

  if (req.path.includes('/export')) {
    action = 'export';
  }

  // Determine human-readable module name
  let moduleName = req.path;
  if (req.path.includes('/api/pegawai')) moduleName = 'Data Pegawai';
  else if (req.path.includes('/api/tunjangan/setting')) moduleName = 'Setting Tunjangan Transport';
  else if (req.path.includes('/api/tunjangan')) moduleName = 'Tunjangan Transport';
  else if (req.path.includes('/api/master')) moduleName = 'Master Data';
  else if (req.path.includes('/api/user')) moduleName = 'Manajemen User';
  else if (req.path.includes('/api/role')) moduleName = 'Role & Permission';
  else if (req.path.includes('/api/log')) moduleName = 'Log Aktivitas';

  // Capture original end/finish to log
  res.on('finish', async () => {
    // Only log successful operations
    if (res.statusCode < 400 && req.user) {
      try {
        let actionLabel = action;
        if (action === 'create') actionLabel = 'menambahkan data';
        else if (action === 'update') actionLabel = 'mengubah data';
        else if (action === 'delete') actionLabel = 'menghapus data';
        else if (action === 'read') actionLabel = 'melihat data';
        else if (action === 'export') {
          if (req.path.includes('pdf')) actionLabel = 'mengekspor PDF';
          else if (req.path.includes('excel')) actionLabel = 'mengekspor Excel';
          else actionLabel = 'mengekspor data';
        }

        const payload = { ...req.body, ...req.query };
        if (payload.password) delete payload.password;
        if (payload.token) delete payload.token;
        if (payload.captchaAnswer) delete payload.captchaAnswer;

        const [insertedId] = await db('activities').insert({
          id_user: req.user.id,
          modul: moduleName,
          aksi: action,
          keterangan: `${req.user.identifier} ${actionLabel} pada modul ${moduleName}`,
          tanggal: new Date()
        });

        if (req.app.locals.io) {
          const logData = await db('activities')
            .leftJoin('user', 'activities.id_user', 'user.id')
            .select(
              'activities.id',
              'activities.modul',
              'activities.aksi',
              'activities.keterangan',
              'activities.tanggal',
              'user.identifier as nama_user'
            )
            .where('activities.id', insertedId)
            .first();
            
          req.app.locals.io.to('superadmin-room').emit('new_log', logData);
        }
      } catch (error) {
        console.error('Failed to log activity:', error);
      }
    }
  });

  next();
};

module.exports = logMiddleware;
