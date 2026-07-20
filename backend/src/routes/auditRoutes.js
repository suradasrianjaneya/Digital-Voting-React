import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', protect, requireAdmin, getAuditLogs);

export default router;
