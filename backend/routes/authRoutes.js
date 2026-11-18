const express = require('express');
const { register, login, changePassword, getUsers, toggleUserStatus } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.patch('/change-password', protect, changePassword);
router.get('/users', protect, authorize('admin'), getUsers);
router.patch('/users/:id/status', protect, authorize('admin'), toggleUserStatus);

module.exports = router;

