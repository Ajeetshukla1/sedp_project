import { type Request, type Response } from 'express';
import * as service from '../services/timeline.service.js';

export async function getTimeline(request: Request, response: Response): Promise<void> {
  try {
    const timeline = await service.getPatientTimeline(request.params.patientId as string);
    response.status(200).json(timeline);
  } catch {
    response.status(500).json({ message: 'Unable to load patient timeline' });
  }
}
