import { type Request, type Response } from 'express';
import { type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  getAISummaryById,
  getAISummary,
  generateAISummary,
  listAISummaries,
} from '../services/ai-summary.service.js';
import { getPatient } from '../services/patient.service.js';

type Auth = { userId: string; role: 'patient' | 'doctor' | 'admin' };
function auth(request: Request): Auth {
  return (request as AuthenticatedRequest).auth as Auth;
}
function patientId(request: Request): string {
  return request.params.patientId as string;
}
function isWriter(request: Request): boolean {
  return auth(request).role === 'doctor' || auth(request).role === 'admin';
}

export async function createAISummary(request: Request, response: Response): Promise<void> {
  if (!isWriter(request)) {
    response.status(403).json({ message: 'Only doctors and admins can generate summaries' });
    return;
  }
  try {
    const summary = await generateAISummary(patientId(request), auth(request));
    response.status(201).json({ summary });
  } catch (error) {
    if (error instanceof Error && error.message === 'AI_UNAVAILABLE') {
      response.status(503).json({ message: 'AI summarization is not configured' });
      return;
    }
    response.status(502).json({ message: 'AI summary could not be generated' });
  }
}

export async function listSummaries(request: Request, response: Response): Promise<void> {
  response.status(200).json({ summaries: await listAISummaries(patientId(request)) });
}

export async function getSummary(request: Request, response: Response): Promise<void> {
  const summary = await getAISummary(patientId(request), request.params.summaryId as string);
  if (!summary) {
    response.status(404).json({ message: 'AI summary not found' });
    return;
  }
  response.status(200).json({ summary });
}

export async function getSummaryById(request: Request, response: Response): Promise<void> {
  const summary = await getAISummaryById(request.params.summaryId as string);
  if (!summary) {
    response.status(404).json({ message: 'AI summary not found' });
    return;
  }
  try {
    await getPatient(summary.patientId.toString(), auth(request));
    response.status(200).json({ summary });
  } catch {
    response.status(403).json({ message: 'Summary access is not authorized' });
  }
}
