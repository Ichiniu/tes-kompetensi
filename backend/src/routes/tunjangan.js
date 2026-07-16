const express = require('express');
const router = express.Router();
const tunjanganController = require('../controllers/tunjanganController');
const { authenticateToken, checkPermission } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Tunjangan Transport
 *   description: API untuk Tunjangan Transport
 */

/**
 * @swagger
 * /api/tunjangan/setting:
 *   get:
 *     summary: Ambil setting tunjangan aktif
 *     tags: [Tunjangan Transport]
 *     responses:
 *       200:
 *         description: Berhasil
 */
router.get('/setting', checkPermission('Setting Tunjangan Transport', 'read'), tunjanganController.getSetting);

/**
 * @swagger
 * /api/tunjangan/setting:
 *   post:
 *     summary: Simpan setting tunjangan baru
 *     tags: [Tunjangan Transport]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               base_fare:
 *                 type: number
 *               min_km:
 *                 type: number
 *               max_km:
 *                 type: number
 *               berlaku_mulai:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Berhasil disimpan
 */
router.post('/setting', checkPermission('Setting Tunjangan Transport', 'create'), tunjanganController.saveSetting);

/**
 * @swagger
 * /api/tunjangan:
 *   get:
 *     summary: Ambil daftar tunjangan transport
 *     tags: [Tunjangan Transport]
 *     parameters:
 *       - in: query
 *         name: tahun
 *         schema:
 *           type: integer
 *         description: Filter tahun
 *     responses:
 *       200:
 *         description: Berhasil
 */
router.get('/', checkPermission('Modul Tunjangan Transport', 'read'), tunjanganController.getTunjanganList);

/**
 * @swagger
 * /api/tunjangan/{id}:
 *   get:
 *     summary: Ambil detail tunjangan transport
 *     tags: [Tunjangan Transport]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Berhasil
 */
router.get('/:id', checkPermission('Modul Tunjangan Transport', 'read'), tunjanganController.getTunjanganDetail);

/**
 * @swagger
 * /api/tunjangan/calculate:
 *   post:
 *     summary: Hitung tunjangan transport bulan tertentu
 *     tags: [Tunjangan Transport]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bulan:
 *                 type: integer
 *               tahun:
 *                 type: integer
 *               data_hari_kerja:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id_pegawai:
 *                       type: integer
 *                     hari_kerja:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Berhasil kalkulasi
 */
router.post('/calculate', checkPermission('Modul Tunjangan Transport', 'create'), tunjanganController.calculateTunjangan);


module.exports = router;
