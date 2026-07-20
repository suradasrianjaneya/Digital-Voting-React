import { z } from 'zod';

const fieldDefinitionSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  type: z.enum(['TEXT', 'NUMBER', 'DATE', 'URL', 'IMAGE', 'TEXTAREA']),
  isRequired: z.boolean().default(false),
  isVisibleOnCard: z.boolean().default(true),
  isCustom: z.boolean().default(false),
});

const eligibilitySchema = z.object({
  emailDomain: z.string().nullable().optional(),
  specificEmail: z.string().email('Invalid whitelisted email').nullable().optional(),
});

export const createElectionSchema = z.object({
  name: z.string().min(3, 'Election name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.string().min(2, 'Election type/label is required'),
  startDate: z.string().min(1, 'Start Date is required'),
  endDate: z.string().min(1, 'End Date is required'),
  votingStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start Time must be in 24h format (HH:MM)'),
  votingEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End Time must be in 24h format (HH:MM)'),
  maxVotesAllowed: z.number().int().min(1).default(1),
  allowMultiplePositions: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  bannerUrl: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
  rules: z.string().nullable().optional(),
  fieldDefinitions: z.array(fieldDefinitionSchema).default([]),
  eligibilities: z.array(eligibilitySchema).default([]),
});

export const updateElectionSchema = createElectionSchema.partial().extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED']).optional(),
});
