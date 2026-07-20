import { Router } from 'express';
import {
  addCandidate,
  getCandidates,
  updateCandidate,
  deleteCandidate,
} from '../controllers/candidateController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { createCandidateSchema, updateCandidateSchema } from '../validators/candidateValidator.js';

const router = Router();

// Retrieve candidate list
router.get('/election/:electionId', protect, getCandidates);

// Mutations (ownership checked in controller)
router.post('/election/:electionId', protect, validate(createCandidateSchema), addCandidate);
router.put('/:id', protect, validate(updateCandidateSchema), updateCandidate);
router.delete('/:id', protect, deleteCandidate);

export default router;
