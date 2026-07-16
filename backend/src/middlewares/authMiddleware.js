const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_jmc_tech_test';

/**
 * Middleware for authenticating JWT token via cookie
 */
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token; // Read from cookie instead of header

  if (!token) {
    return res.status(401).json({ message: 'Token tidak disediakan' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token tidak valid atau sudah kedaluwarsa' });
    }
    req.user = user;
    next();
  });
};

/**
 * Middleware for CSRF protection
 */
const verifyCsrfToken = (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const xsrfHeader = req.headers['x-xsrf-token'];
    const xsrfCookie = req.cookies['XSRF-TOKEN'];

    // Double-submit cookie pattern: header harus cocok dengan cookie
    if (!xsrfHeader || !xsrfCookie || xsrfHeader !== xsrfCookie) {
      return res.status(403).json({ message: 'Invalid CSRF token' });
    }
  }
  next();
};

/**
 * Middleware for RBAC (Role-Based Access Control)

 * @param {string} modulFitur - Nama modul/fitur di tabel role_permission
 * @param {string} action - 'create', 'read', 'update', 'delete', atau 'akses'
 */
const checkPermission = (modulFitur, action) => {
  return async (req, res, next) => {
    try {
      const roleId = req.user.id_role;
      
      const permission = await db('role_permission')
        .where({ id_role: roleId, modul_fitur: modulFitur })
        .first();

      if (!permission) {
        return res.status(403).json({ message: 'Akses ditolak: Anda tidak memiliki permission untuk modul ini' });
      }

      if (action === 'akses' && !permission.akses) {
        return res.status(403).json({ message: 'Akses ditolak ke modul ini' });
      }

      if (action === 'create' && !permission.create) {
        return res.status(403).json({ message: 'Akses ditolak: Anda tidak memiliki akses create' });
      }

      if (['read', 'update', 'delete'].includes(action)) {
        if (permission[action] === 'No') {
          return res.status(403).json({ message: `Akses ditolak: Anda tidak memiliki akses ${action}` });
        }
        // Save the specific permission (All/Own) so controllers can filter if needed
        req.permissionDetail = permission[action]; 
      }

      next();
    } catch (error) {
      console.error('RBAC Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
};

module.exports = {
  authenticateToken,
  verifyCsrfToken,
  checkPermission,
  JWT_SECRET
};
