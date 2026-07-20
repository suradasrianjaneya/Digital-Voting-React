import prisma from '../config/db.js';
import { logEvent } from '../services/auditService.js';

const getIpAddress = (req) => {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
};

export const addCandidate = async (req, res, next) => {
  try {
    const { electionId } = req.params;
    const { fieldValues } = req.body;
    const ipAddress = getIpAddress(req);

    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: { fieldDefinitions: true },
    });

    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    // Authorization: Admin or Creator
    if (req.user.role !== 'ADMIN' && election.creatorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to add candidates to this election' });
    }

    const missingFields = [];
    for (const definition of election.fieldDefinitions) {
      const val = fieldValues[definition.id];
      if (definition.isRequired && (val === undefined || val === null || val.trim() === '')) {
        missingFields.push(definition.name);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required field(s): ${missingFields.join(', ')}`,
      });
    }

    const candidate = await prisma.$transaction(async (tx) => {
      const cand = await tx.candidate.create({
        data: { electionId },
      });

      const valuesData = Object.entries(fieldValues)
        .filter(([_, val]) => val !== undefined && val !== null)
        .map(([definitionId, val]) => ({
          candidateId: cand.id,
          fieldDefinitionId: definitionId,
          value: val.trim(),
        }));

      if (valuesData.length > 0) {
        await tx.candidateFieldValue.createMany({
          data: valuesData,
        });
      }

      return cand;
    });

    await logEvent({
      userId: req.user.id,
      action: 'CANDIDATE_CREATE',
      details: `Added candidate ID: ${candidate.id} to election "${election.name}"`,
      ipAddress,
    });

    res.status(201).json({
      success: true,
      message: 'Candidate added successfully',
      candidateId: candidate.id,
    });
  } catch (error) {
    next(error);
  }
};

export const getCandidates = async (req, res, next) => {
  try {
    const { electionId } = req.params;

    const candidates = await prisma.candidate.findMany({
      where: { electionId },
      include: {
        fieldValues: {
          include: {
            fieldDefinition: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const formattedCandidates = candidates.map((cand) => {
      const details = {};
      const fields = cand.fieldValues.map((val) => {
        details[val.fieldDefinition.name] = val.value;
        return {
          definitionId: val.fieldDefinitionId,
          name: val.fieldDefinition.name,
          type: val.fieldDefinition.type,
          value: val.value,
          isRequired: val.fieldDefinition.isRequired,
          isVisibleOnCard: val.fieldDefinition.isVisibleOnCard,
          isCustom: val.fieldDefinition.isCustom,
        };
      });

      return {
        id: cand.id,
        electionId: cand.electionId,
        fields,
        details,
        createdAt: cand.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      candidates: formattedCandidates,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fieldValues } = req.body;
    const ipAddress = getIpAddress(req);

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        election: {
          include: { fieldDefinitions: true },
        },
      },
    });

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // Authorization: Admin or Creator
    if (req.user.role !== 'ADMIN' && candidate.election.creatorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this candidate' });
    }

    const missingFields = [];
    for (const definition of candidate.election.fieldDefinitions) {
      const val = fieldValues[definition.id];
      if (definition.isRequired && (val === undefined || val === null || val.trim() === '')) {
        missingFields.push(definition.name);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required field(s): ${missingFields.join(', ')}`,
      });
    }

    await prisma.$transaction(async (tx) => {
      for (const [definitionId, val] of Object.entries(fieldValues)) {
        if (val === undefined || val === null) continue;
        await tx.candidateFieldValue.upsert({
          where: {
            candidateId_fieldDefinitionId: {
              candidateId: id,
              fieldDefinitionId: definitionId,
            },
          },
          update: { value: val.trim() },
          create: {
            candidateId: id,
            fieldDefinitionId: definitionId,
            value: val.trim(),
          },
        });
      }
    });

    await logEvent({
      userId: req.user.id,
      action: 'CANDIDATE_UPDATE',
      details: `Updated candidate ID: ${id} details`,
      ipAddress,
    });

    res.status(200).json({
      success: true,
      message: 'Candidate details updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ipAddress = getIpAddress(req);

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: { election: true },
    });

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // Authorization: Admin or Creator
    if (req.user.role !== 'ADMIN' && candidate.election.creatorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to remove this candidate' });
    }

    await prisma.candidate.delete({
      where: { id },
    });

    await logEvent({
      userId: req.user.id,
      action: 'CANDIDATE_DELETE',
      details: `Deleted candidate ID: ${id}`,
      ipAddress,
    });

    res.status(200).json({
      success: true,
      message: 'Candidate deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
