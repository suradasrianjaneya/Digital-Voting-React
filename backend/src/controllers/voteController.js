import { castVote } from '../services/votingService.js';
import prisma from '../config/db.js';

const getIpAddress = (req) => {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
};

export const submitVote = async (req, res, next) => {
  try {
    const { electionId, candidateId } = req.body;
    const userId = req.user.id;
    const ipAddress = getIpAddress(req);

    if (!electionId || !candidateId) {
      return res.status(400).json({
        success: false,
        message: 'Election ID and Candidate ID are required to cast a vote.',
      });
    }

    const vote = await castVote({
      userId,
      electionId,
      candidateId,
      ipAddress,
    });

    res.status(201).json({
      success: true,
      message: 'Your vote has been cast and recorded successfully.',
      voteId: vote.id,
    });
  } catch (error) {
    next(error);
  }
};

export const getVotingStatus = async (req, res, next) => {
  try {
    const { electionId } = req.params;
    const userId = req.user.id;

    const election = await prisma.election.findUnique({
      where: { id: electionId },
      select: { maxVotesAllowed: true },
    });

    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    const votes = await prisma.vote.findMany({
      where: { userId, electionId },
      select: { candidateId: true },
    });

    const votesCount = votes.length;
    const maxVotesAllowed = election.maxVotesAllowed;

    res.status(200).json({
      success: true,
      hasVoted: votesCount >= maxVotesAllowed,
      votesCount,
      maxVotesAllowed,
      votedCandidateIds: votes.map((v) => v.candidateId),
    });
  } catch (error) {
    next(error);
  }
};
