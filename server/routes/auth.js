import express from 'express';
import { register, login, getMe, getUsers, updateUserRole, deleteUser, updatePassword, updateUser } from '../controllers/authController.js';

import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users', protect, authorize('admin'), getUsers);
router.route('/users/:id')
    .put(protect, updateUser)
    .delete(protect, deleteUser);
router.put('/users/:id/role', protect, authorize('admin'), updateUserRole);
router.put('/users/:id/password', protect, updatePassword);

export default router;
