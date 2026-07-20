import { Router } from 'express';
import {
  createElection,
  joinElectionByCode,
  getElections,
  getElectionById,
  updateElection,
  changeElectionStatus,
  deleteElection,
  getElectionResults,
} from '../controllers/electionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { createElectionSchema, updateElectionSchema } from '../validators/electionValidator.js';

const router = Router();

// Protected routes (available to all verified voters)
router.get('/', protect, getElections);
router.post('/join', protect, joinElectionByCode);
router.get('/:id', protect, getElectionById);
router.get('/:id/results', protect, getElectionResults);

// Election mutations (ownership is checked at the controller level: admin or creator)
router.post('/', protect, validate(createElectionSchema), createElection);
router.put('/:id', protect, validate(updateElectionSchema), updateElection);
router.put('/:id/status', protect, changeElectionStatus);
router.delete('/:id', protect, deleteElection);

export default router;
