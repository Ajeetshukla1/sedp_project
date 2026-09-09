import { z } from 'zod';

const citedItem = z.object({
  text: z.string().trim().min(1),
  sourceIds: z.array(z.string().min(1)).min(1),
});

export const aiSummarySchema = z.object({
  overview: z.array(citedItem),
  relevantHistory: z.array(citedItem),
  currentConditions: z.array(citedItem),
  medications: z.array(citedItem),
  allergies: z.array(citedItem),
  recentInvestigations: z.array(citedItem),
  importantChanges: z.array(citedItem),
  trends: z.array(citedItem),
  conflictsMissingInformation: z.array(citedItem),
  evidence: z.array(
    z.object({ sourceId: z.string().min(1), description: z.string().trim().min(1) }),
  ),
});

export type AISummaryContent = z.infer<typeof aiSummarySchema>;
