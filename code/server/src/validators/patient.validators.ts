import { z } from 'zod';

export const patientSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  dateOfBirth: z.iso.date(),
  sex: z.enum(['female', 'male', 'intersex', 'unknown']),
  contact: z
    .object({
      phone: z.string().trim().max(40).optional(),
      email: z.email().optional(),
      address: z.string().trim().max(240).optional(),
    })
    .optional(),
});

export const patientSearchSchema = z.object({
  search: z.string().trim().max(100).optional(),
});

export type PatientInput = z.infer<typeof patientSchema>;
