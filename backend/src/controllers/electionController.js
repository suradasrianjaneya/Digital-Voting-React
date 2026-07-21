import prisma from '../config/db.js';
import { logEvent } from '../services/auditService.js';

const getIpAddress = (req) => {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
};

export const createElection = async (req, res, next) => {
  try {
    const {
      name,
      description,
      type,
      startDate,
      endDate,
      votingStartTime,
      votingEndTime,
      maxVotesAllowed,
      allowMultiplePositions,
      isPublic,
      bannerUrl,
      instructions,
      rules,
      fieldDefinitions,
      eligibilities,
    } = req.body;

    const ipAddress = getIpAddress(req);

    // Generate unique 6-character uppercase alphanumeric code
    let inviteCode = '';
    let codeExists = true;
    while (codeExists) {
      inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existing = await prisma.election.findUnique({ where: { inviteCode } });
      if (!existing) codeExists = false;
    }

    const election = await prisma.$transaction(async (tx) => {
      // Create election with creatorId and inviteCode
      const el = await tx.election.create({
        data: {
          name,
          description,
          type,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          votingStartTime,
          votingEndTime,
          maxVotesAllowed,
          allowMultiplePositions,
          isPublic,
          bannerUrl,
          instructions,
          rules,
          creatorId: req.user.id,
          inviteCode,
          status: 'DRAFT',
        },
      });

      // Create field definitions
      if (fieldDefinitions && fieldDefinitions.length > 0) {
        await tx.candidateFieldDefinition.createMany({
          data: fieldDefinitions.map((fd) => ({
            electionId: el.id,
            name: fd.name,
            type: fd.type,
            isRequired: fd.isRequired ?? false,
            isVisibleOnCard: fd.isVisibleOnCard ?? true,
            isCustom: fd.isCustom ?? false,
          })),
        });
      }

      // Create eligibilities if private
      if (!isPublic && eligibilities && eligibilities.length > 0) {
        await tx.electionEligibility.createMany({
          data: eligibilities.map((elig) => ({
            electionId: el.id,
            emailDomain: elig.emailDomain ? elig.emailDomain.trim().toLowerCase() : null,
            specificEmail: elig.specificEmail ? elig.specificEmail.trim().toLowerCase() : null,
          })),
        });
      }

      return el;
    });

    await logEvent({
      userId: req.user.id,
      action: 'ELECTION_CREATE',
      details: `Created election "${name}" (ID: ${election.id}, Invite Code: ${inviteCode})`,
      ipAddress,
    });

    res.status(201).json({
      success: true,
      message: `Election created as a DRAFT. Invite code is ${inviteCode}.`,
      election,
    });
  } catch (error) {
    next(error);
  }
};

export const joinElectionByCode = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    const ipAddress = getIpAddress(req);

    if (!inviteCode) {
      return res.status(400).json({ success: false, message: 'Invite code is required' });
    }

    const election = await prisma.election.findUnique({
      where: { inviteCode: inviteCode.trim().toUpperCase() },
      include: { eligibilities: true },
    });

    if (!election) {
      return res.status(404).json({ success: false, message: 'No election found with this invite code.' });
    }

    const userEmail = req.user.email.toLowerCase().trim();

    // 1. Whitelist the user's specific email to add it to their dashboard
    // For private elections, check if they meet domain/email restrictions first
    if (!election.isPublic) {
      const userDomain = userEmail.split('@')[1];

      // Get predefined eligibility restrictions set by the creator (where isCodeJoined = false)
      const predefinedRules = election.eligibilities.filter((elig) => !elig.isCodeJoined);

      if (predefinedRules.length > 0) {
        // User must match at least one domain or specific email restriction
        const matchesPredefined = predefinedRules.some((rule) => {
          if (rule.specificEmail && rule.specificEmail.toLowerCase() === userEmail) return true;
          if (rule.emailDomain && rule.emailDomain.toLowerCase() === userDomain) return true;
          return false;
        });

        if (!matchesPredefined) {
          return res.status(403).json({
            success: false,
            message: 'You do not meet the domain or email eligibility criteria for this private election.',
          });
        }
      }
    }

    // 2. Add specific email eligibility for dashboard visibility if not already present (runs for all public and private)
    const isAlreadyWhitelisted = election.eligibilities.some(
      (elig) => elig.specificEmail && elig.specificEmail.toLowerCase() === userEmail
    );

    if (!isAlreadyWhitelisted) {
      await prisma.electionEligibility.create({
        data: {
          electionId: election.id,
          specificEmail: userEmail,
          isCodeJoined: true, // Mark as joined via code
        },
      });
    }

    await logEvent({
      userId: req.user.id,
      action: 'ELECTION_JOIN_CODE',
      details: `Joined election "${election.name}" (ID: ${election.id}) using invite code.`,
      ipAddress,
    });

    res.status(200).json({
      success: true,
      message: `Successfully joined election "${election.name}"!`,
      electionId: election.id,
    });
  } catch (error) {
    next(error);
  }
};

export const getElections = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    const userEmail = req.user.email.toLowerCase();
    const now = new Date();

    // Admins see all. Users see their own created ones, and ones they have explicitly joined.
    const whereClause = isAdmin
      ? {}
      : {
          OR: [
            { creatorId: req.user.id },
            {
              status: { not: 'DRAFT' },
              eligibilities: {
                some: {
                  specificEmail: userEmail,
                },
              },
            },
          ],
        };

    const elections = await prisma.election.findMany({
      where: whereClause,
      include: {
        fieldDefinitions: true,
        eligibilities: true,
        _count: {
          select: { candidates: true, votes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Categorize
    const active = [];
    const upcoming = [];
    const completed = [];
    const drafts = [];

    elections.forEach((el) => {
      if (el.status === 'DRAFT') {
        drafts.push(el);
      } else if (el.status === 'ENDED' || now > new Date(el.endDate)) {
        completed.push(el);
      } else if (el.status === 'ACTIVE' && now >= new Date(el.startDate) && now <= new Date(el.endDate)) {
        active.push(el);
      } else {
        upcoming.push(el);
      }
    });

    res.status(200).json({
      success: true,
      active,
      upcoming,
      completed,
      drafts, // Return drafts for creators and admins (draft list query filters ensure standard users only see draft if they created it)
    });
  } catch (error) {
    next(error);
  }
};

export const getElectionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const election = await prisma.election.findUnique({
      where: { id },
      include: {
        fieldDefinitions: {
          orderBy: { createdAt: 'asc' },
        },
        eligibilities: true,
        _count: {
          select: { candidates: true, votes: true },
        },
      },
    });

    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    // Verify draft access: only Admin or creator
    if (election.status === 'DRAFT' && req.user.role !== 'ADMIN' && election.creatorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to election drafts.' });
    }

    res.status(200).json({
      success: true,
      election,
    });
  } catch (error) {
    next(error);
  }
};

export const updateElection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ipAddress = getIpAddress(req);

    const election = await prisma.election.findUnique({ where: { id } });
    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    // Authorization: Admin or Creator
    if (req.user.role !== 'ADMIN' && election.creatorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this election' });
    }

    const {
      name,
      description,
      type,
      startDate,
      endDate,
      votingStartTime,
      votingEndTime,
      maxVotesAllowed,
      allowMultiplePositions,
      isPublic,
      bannerUrl,
      instructions,
      rules,
      status,
      eligibilities,
    } = req.body;

    const updated = await prisma.$transaction(async (tx) => {
      const up = await tx.election.update({
        where: { id },
        data: {
          name,
          description,
          type,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          votingStartTime,
          votingEndTime,
          maxVotesAllowed: maxVotesAllowed ? parseInt(maxVotesAllowed, 10) : undefined,
          allowMultiplePositions,
          isPublic,
          bannerUrl,
          instructions,
          rules,
          status,
        },
      });

      if (eligibilities !== undefined) {
        await tx.electionEligibility.deleteMany({ where: { electionId: id } });
        if (eligibilities.length > 0) {
          await tx.electionEligibility.createMany({
            data: eligibilities.map((elig) => ({
              electionId: id,
              emailDomain: elig.emailDomain ? elig.emailDomain.trim().toLowerCase() : null,
              specificEmail: elig.specificEmail ? elig.specificEmail.trim().toLowerCase() : null,
            })),
          });
        }
      }

      return up;
    });

    await logEvent({
      userId: req.user.id,
      action: 'ELECTION_UPDATE',
      details: `Updated election "${updated.name}" (ID: ${id})`,
      ipAddress,
    });

    res.status(200).json({
      success: true,
      message: 'Election updated successfully',
      election: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const changeElectionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const ipAddress = getIpAddress(req);

    const election = await prisma.election.findUnique({ where: { id } });
    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    // Authorization: Admin or Creator
    if (req.user.role !== 'ADMIN' && election.creatorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to change status' });
    }

    const updated = await prisma.election.update({
      where: { id },
      data: { status },
    });

    await logEvent({
      userId: req.user.id,
      action: `ELECTION_STATUS_${status}`,
      details: `Changed status of election "${election.name}" to ${status}`,
      ipAddress,
    });

    res.status(200).json({
      success: true,
      message: `Election status changed to ${status}`,
      election: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteElection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ipAddress = getIpAddress(req);

    const election = await prisma.election.findUnique({ where: { id } });
    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    // Authorization: Admin or Creator
    if (req.user.role !== 'ADMIN' && election.creatorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this election' });
    }

    await prisma.election.delete({
      where: { id },
    });

    await logEvent({
      userId: req.user.id,
      action: 'ELECTION_DELETE',
      details: `Deleted election "${election.name}" (ID: ${id})`,
      ipAddress,
    });

    res.status(200).json({
      success: true,
      message: 'Election deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getElectionResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    const election = await prisma.election.findUnique({
      where: { id },
      include: {
        candidates: {
          include: {
            fieldValues: {
              include: { fieldDefinition: true },
            },
          },
        },
        votes: true,
      },
    });

    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    // Results are only public if election is ended, unless creator/admin
    const isAdmin = req.user.role === 'ADMIN' || election.creatorId === req.user.id;
    const isEnded = election.status === 'ENDED' || new Date() > new Date(election.endDate);

    if (!isEnded && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Results are sealed and will be released once the election concludes.',
      });
    }

    const totalVotesCast = election.votes.length;

    const candidatesResults = election.candidates.map((cand) => {
      const nameVal = cand.fieldValues.find(
        (val) => val.fieldDefinition.name.toLowerCase().includes('name')
      );
      const name = nameVal ? nameVal.value : `Candidate #${cand.id.substring(0, 6)}`;

      const partyVal = cand.fieldValues.find(
        (val) => val.fieldDefinition.name.toLowerCase().includes('party')
      );
      const party = partyVal ? partyVal.value : 'Independent';

      const photoVal = cand.fieldValues.find(
        (val) => val.fieldDefinition.name.toLowerCase().includes('photo')
      );
      const photo = photoVal ? photoVal.value : null;

      const votesCount = election.votes.filter((v) => v.candidateId === cand.id).length;
      const percentage = totalVotesCast > 0 ? ((votesCount / totalVotesCast) * 100).toFixed(2) : '0.00';

      return {
        id: cand.id,
        name,
        party,
        photo,
        votesCount,
        percentage: parseFloat(percentage),
      };
    });

    candidatesResults.sort((a, b) => b.votesCount - a.votesCount);

    let winners = [];
    if (totalVotesCast > 0 && candidatesResults.length > 0) {
      const maxVotes = candidatesResults[0].votesCount;
      winners = candidatesResults.filter((c) => c.votesCount === maxVotes);
    }

    res.status(200).json({
      success: true,
      results: {
        electionName: election.name,
        electionDescription: election.description,
        totalVotesCast,
        candidates: candidatesResults,
        winners,
      },
    });
  } catch (error) {
    next(error);
  }
};
