import { Router } from 'express';
import { submitVote, getVotingStatus } from '../controllers/voteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', protect, submitVote);
router.get('/status/:electionId', protect, getVotingStatus);

export default router;
