import { z } from 'zod';

export const reportMetadataSchema = z.object({
  reportType: z.string().trim().min(1).max(100),
  clinicalEventDate: z.iso.date(),
  notes: z.string().trim().max(2000).optional(),
});

export type ReportMetadata = z.infer<typeof reportMetadataSchema>;
