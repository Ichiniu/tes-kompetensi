const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/data', masterController.getJabatanDepartemen);
router.get('/wilayah/autocomplete', masterController.autocompleteWilayah);
router.get('/roles', masterController.getRoles);

module.exports = router;
