import { z } from 'zod';

export const createCandidateSchema = z.object({
  fieldValues: z.record(z.string(), z.string().nullable().optional()),
});

export const updateCandidateSchema = z.object({
  fieldValues: z.record(z.string(), z.string().nullable().optional()),
});
