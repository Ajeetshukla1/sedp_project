import { type NextFunction, type Request, type Response } from 'express';
import { Types } from 'mongoose';
import { type AuthenticatedRequest } from './auth.middleware.js';
import { getPatient } from '../services/patient.service.js';

export async function requirePatientAccess(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const patientId = request.params.patientId;
  if (typeof patientId !== 'string' || !Types.ObjectId.isValid(patientId)) {
    response.status(404).json({ message: 'Patient not found' });
    return;
  }
  try {
    await getPatient(
      patientId,
      (request as AuthenticatedRequest).auth as {
        userId: string;
        role: 'patient' | 'doctor' | 'admin';
      },
    );
    next();
  } catch (error) {
    response
      .status(error instanceof Error && error.message === 'FORBIDDEN' ? 403 : 404)
      .json({ message: 'Patient not found' });
  }
}
