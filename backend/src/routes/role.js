const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { checkPermission, authenticateToken } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', checkPermission('Kelola Role', 'read'), roleController.getRoles);
router.get('/:id_role/permissions', checkPermission('Kelola Role', 'read'), roleController.getPermissionsByRole);
router.put('/:id_role/permissions', checkPermission('Kelola Role', 'update'), roleController.updatePermissions);

module.exports = router;
