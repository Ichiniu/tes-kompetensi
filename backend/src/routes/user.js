const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { checkPermission, authenticateToken } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', checkPermission('Kelola User', 'read'), userController.getAll);
router.get('/:id', checkPermission('Kelola User', 'read'), userController.getById);
router.post('/', checkPermission('Kelola User', 'create'), userController.create);
router.put('/:id', checkPermission('Kelola User', 'update'), userController.update);
router.delete('/:id', checkPermission('Kelola User', 'delete'), userController.delete);

module.exports = router;
