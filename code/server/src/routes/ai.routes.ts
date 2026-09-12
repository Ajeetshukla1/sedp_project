import { Router } from 'express';
import {
  createAISummary,
  getSummary,
  listSummaries,
} from '../controllers/ai-summary.controller.js';
import { requirePatientAccess } from '../middleware/patient-access.middleware.js';
import { auditSensitiveResponse } from '../middleware/audit.middleware.js';

export const aiRouter = Router({ mergeParams: true });
aiRouter.use(requirePatientAccess);
aiRouter.use(auditSensitiveResponse);
aiRouter.post('/ai-summaries', createAISummary);
aiRouter.get('/ai-summaries', listSummaries);
aiRouter.get('/ai-summaries/:summaryId', getSummary);
