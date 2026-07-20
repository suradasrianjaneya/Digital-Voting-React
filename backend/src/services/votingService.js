import prisma from '../config/db.js';

export const castVote = async ({ userId, electionId, candidateId, ipAddress }) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Row-lock the User record to block concurrent vote submissions from the same session
    await tx.$executeRaw`SELECT * FROM "User" WHERE id = ${userId} FOR UPDATE;`;

    // 2. Fetch the election details to verify active states
    const election = await tx.election.findUnique({
      where: { id: electionId },
      include: {
        eligibilities: true,
      },
    });

    if (!election) {
      const err = new Error('Election not found');
      err.statusCode = 404;
      throw err;
    }

    if (election.status !== 'ACTIVE') {
      const err = new Error('This election is not currently active');
      err.statusCode = 400;
      throw err;
    }

    // 3. Time Validation Check
    const now = new Date();
    
    // Check Date Boundaries
    const electionStart = new Date(election.startDate);
    const electionEnd = new Date(election.endDate);
    electionStart.setHours(0, 0, 0, 0);
    electionEnd.setHours(23, 59, 59, 999);

    if (now < electionStart || now > electionEnd) {
      const err = new Error('Voting dates for this election are closed or have not started');
      err.statusCode = 400;
      throw err;
    }

    // Check Daily Time Windows
    const [startH, startM] = election.votingStartTime.split(':').map(Number);
    const [endH, endM] = election.votingEndTime.split(':').map(Number);
    
    const startTimeToday = new Date(now);
    startTimeToday.setHours(startH, startM, 0, 0);
    
    const endTimeToday = new Date(now);
    endTimeToday.setHours(endH, endM, 0, 0);

    if (now < startTimeToday || now > endTimeToday) {
      const err = new Error(`Voting for this election is only allowed between ${election.votingStartTime} and ${election.votingEndTime} daily`);
      err.statusCode = 400;
      throw err;
    }

    // 4. Verify User Profile & Access Rights
    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const err = new Error('Voter profile not found');
      err.statusCode = 404;
      throw err;
    }

    if (!user.isVerified) {
      const err = new Error('Account must be email verified to cast a vote');
      err.statusCode = 403;
      throw err;
    }

    if (!user.isApproved) {
      const err = new Error('Account is pending approval by an Admin');
      err.statusCode = 403;
      throw err;
    }

    // 5. Verify Eligibility for Private Elections
    if (!election.isPublic) {
      const email = user.email.toLowerCase();
      const domain = email.split('@')[1];

      const isEligible = election.eligibilities.some((rule) => {
        if (rule.specificEmail && rule.specificEmail.toLowerCase() === email) return true;
        if (rule.emailDomain && rule.emailDomain.toLowerCase() === domain) return true;
        return false;
      });

      if (!isEligible) {
        const err = new Error('You do not meet the domain or email eligibility criteria for this private election');
        err.statusCode = 403;
        throw err;
      }
    }

    // 6. Enforce One-Person-One-Vote (or maxVotesAllowed check)
    const existingVotes = await tx.vote.findMany({
      where: { userId, electionId },
    });

    if (existingVotes.length >= election.maxVotesAllowed) {
      const err = new Error(`You have already cast the maximum of ${election.maxVotesAllowed} vote(s) in this election`);
      err.statusCode = 400;
      throw err;
    }

    const alreadyVotedForCandidate = existingVotes.some((v) => v.candidateId === candidateId);
    if (alreadyVotedForCandidate) {
      const err = new Error('You have already voted for this specific candidate');
      err.statusCode = 400;
      throw err;
    }

    // 7. Validate Candidate exists inside this Election
    const candidate = await tx.candidate.findFirst({
      where: { id: candidateId, electionId },
    });

    if (!candidate) {
      const err = new Error('Invalid candidate selection for this election');
      err.statusCode = 400;
      throw err;
    }

    // 8. Log and store the vote
    const vote = await tx.vote.create({
      data: {
        userId,
        electionId,
        candidateId,
      },
    });

    // Write audit log entry (inside transaction context)
    await tx.auditLog.create({
      data: {
        userId,
        action: 'VOTE_CAST',
        details: `Voted in election "${election.name}" (ID: ${election.id}) for candidate ID: ${candidateId}`,
        ipAddress,
      },
    });

    return vote;
  });
};
