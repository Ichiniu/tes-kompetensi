const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, checkPermission } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', checkPermission('Modul Log', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;

    let query = db('activities')
      .leftJoin('user', 'activities.id_user', 'user.id')
      .select(
        'activities.id',
        'activities.modul',
        'activities.aksi',
        'activities.keterangan',
        'activities.tanggal',
        'user.identifier as nama_user'
      )
      .orderBy('activities.tanggal', 'desc');

    if (search) {
      query = query.where('user.identifier', 'like', `%${search}%`)
                   .orWhere('activities.modul', 'like', `%${search}%`)
                   .orWhere('activities.aksi', 'like', `%${search}%`);
    }

    const data = await query.limit(Number(limit)).offset((Number(page) - 1) * Number(limit));

    const totalQuery = db('activities').leftJoin('user', 'activities.id_user', 'user.id');
    if (search) {
      totalQuery.where('user.identifier', 'like', `%${search}%`)
                .orWhere('activities.modul', 'like', `%${search}%`);
    }
    const total = await totalQuery.count('activities.id as count').first();

    res.json({
      data,
      pagination: {
        total: total.count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total.count / Number(limit))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching log' });
  }
});

module.exports = router;
