import { Router } from 'express';
import {
  getProfile,
  updatePassword,
  getUsers,
  toggleUserApproval,
  changeUserRole,
  deleteUser,
} from '../controllers/userController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Voter profile dashboard
router.get('/profile', protect, getProfile);
router.put('/profile/password', protect, updatePassword);

// Administrative moderator tasks (Admin only)
router.get('/', protect, requireAdmin, getUsers);
router.put('/:id/approval', protect, requireAdmin, toggleUserApproval);
router.put('/:id/role', protect, requireAdmin, changeUserRole);
router.delete('/:id', protect, requireAdmin, deleteUser);

export default router;
