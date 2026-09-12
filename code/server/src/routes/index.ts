import { Router, type Request, type Response } from 'express';
import { authRouter } from './auth.routes.js';
import { patientRouter } from './patient.routes.js';
import { getSummaryById } from '../controllers/ai-summary.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const apiRouter = Router();

apiRouter.get('/health', (_request: Request, response: Response): void => {
  response.status(200).json({ status: 'ok' });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/patients', patientRouter);
apiRouter.get('/ai-summaries/:summaryId', requireAuth, getSummaryById);
