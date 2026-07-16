const express = require('express');
const router = express.Router();
const pegawaiController = require('../controllers/pegawaiController');
const { authenticateToken, checkPermission } = require('../middlewares/authMiddleware');
const { uploadPegawaiFoto, magicByteValidator } = require('../middlewares/uploadMiddleware');

router.use(authenticateToken);

// autosuggest & export
router.get('/autosuggest', pegawaiController.autosuggest);
router.get('/dashboard-stats', checkPermission('Dashboard', 'read'), pegawaiController.getDashboardStats);
router.get('/export/pdf', checkPermission('Modul Data Pegawai', 'read'), pegawaiController.exportPdf);
router.get('/export/excel', checkPermission('Modul Data Pegawai', 'read'), pegawaiController.exportExcel);
router.get('/export/pdf/:id', checkPermission('Modul Data Pegawai', 'read'), pegawaiController.exportDetailPdf);

// CRUD
router.post('/bulk-action', checkPermission('Modul Data Pegawai', 'delete'), pegawaiController.bulkAction);
router.get('/', checkPermission('Modul Data Pegawai', 'read'), pegawaiController.getList);
router.get('/:id', checkPermission('Modul Data Pegawai', 'read'), pegawaiController.getDetail);
router.get('/:id/foto', checkPermission('Modul Data Pegawai', 'read'), pegawaiController.getFoto);
router.post('/', checkPermission('Modul Data Pegawai', 'create'), uploadPegawaiFoto, magicByteValidator, pegawaiController.create);
router.put('/:id', checkPermission('Modul Data Pegawai', 'update'), uploadPegawaiFoto, magicByteValidator, pegawaiController.update);
router.delete('/:id', checkPermission('Modul Data Pegawai', 'delete'), pegawaiController.delete);

module.exports = router;
