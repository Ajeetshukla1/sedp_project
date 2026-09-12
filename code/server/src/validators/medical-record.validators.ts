import { z } from 'zod';

const optionalDate = z.iso.date().optional();

export const encounterSchema = z.object({
  type: z.string().trim().min(1).max(80),
  reason: z.string().trim().min(1).max(240),
  notes: z.string().trim().max(2000).optional(),
  occurredAt: z.iso.datetime(),
});

export const conditionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  status: z.enum(['active', 'resolved', 'unknown']).default('unknown'),
  diagnosedAt: optionalDate,
  resolvedAt: optionalDate,
  notes: z.string().trim().max(2000).optional(),
});

export const medicationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  dosage: z.string().trim().max(120).optional(),
  frequency: z.string().trim().max(120).optional(),
  route: z.string().trim().max(80).optional(),
  status: z.enum(['active', 'discontinued', 'completed', 'unknown']).default('unknown'),
  startDate: optionalDate,
  endDate: optionalDate,
  notes: z.string().trim().max(2000).optional(),
});

export const allergySchema = z.object({
  substance: z.string().trim().min(1).max(120),
  reaction: z.string().trim().max(240).optional(),
  status: z.enum(['active', 'resolved', 'unknown']).default('unknown'),
  recordedAt: z.iso.datetime(),
});

export const observationSchema = z.object({
  type: z.string().trim().min(1).max(80),
  normalizedName: z.string().trim().min(1).max(120),
  originalName: z.string().trim().min(1).max(120),
  value: z.number().finite(),
  unit: z.string().trim().min(1).max(40),
  referenceLow: z.number().finite().optional(),
  referenceHigh: z.number().finite().optional(),
  observedAt: z.iso.datetime(),
  extractionStatus: z.enum(['extracted', 'needs_review', 'verified']).default('verified'),
});

export type EncounterInput = z.infer<typeof encounterSchema>;
export type ConditionInput = z.infer<typeof conditionSchema>;
export type MedicationInput = z.infer<typeof medicationSchema>;
export type AllergyInput = z.infer<typeof allergySchema>;
export type ObservationInput = z.infer<typeof observationSchema>;
