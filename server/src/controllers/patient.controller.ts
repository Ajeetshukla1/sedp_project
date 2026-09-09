import { type Request, type Response } from 'express';
import { type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { recordAuditEvent } from '../services/audit.service.js';
import {
  createPatient,
  getPatient,
  listPatients,
  updatePatient,
} from '../services/patient.service.js';
import { patientSchema, patientSearchSchema } from '../validators/patient.validators.js';

function authContext(request: Request) {
  return (request as AuthenticatedRequest).auth as {
    userId: string;
    role: 'patient' | 'doctor' | 'admin';
  };
}

function handlePatientError(error: unknown, response: Response): void {
  if (error instanceof Error && error.message === 'FORBIDDEN') {
    response.status(403).json({ message: 'Patient access is not authorized' });
    return;
  }
  response.status(400).json({ message: 'Invalid patient request' });
}

export async function listPatientRecords(request: Request, response: Response): Promise<void> {
  try {
    const { search } = patientSearchSchema.parse(request.query);
    const patients = await listPatients(authContext(request), search);
    response.status(200).json({ patients });
  } catch (error) {
    handlePatientError(error, response);
  }
}

export async function createPatientRecord(request: Request, response: Response): Promise<void> {
  try {
    const patient = await createPatient(patientSchema.parse(request.body), authContext(request));
    await recordAuditEvent({
      actorUserId: authContext(request).userId,
      action: 'patient.created',
      resourceType: 'Patient',
      resourceId: patient._id.toString(),
      patientId: patient._id.toString(),
    });
    response.status(201).json({ patient });
  } catch (error) {
    handlePatientError(error, response);
  }
}

export async function getPatientRecord(request: Request, response: Response): Promise<void> {
  try {
    const patient = await getPatient(request.params.patientId as string, authContext(request));
    if (!patient) {
      response.status(404).json({ message: 'Patient not found' });
      return;
    }
    await recordAuditEvent({
      actorUserId: authContext(request).userId,
      action: 'patient.viewed',
      resourceType: 'Patient',
      resourceId: patient._id.toString(),
      patientId: patient._id.toString(),
    });
    response.status(200).json({ patient });
  } catch (error) {
    handlePatientError(error, response);
  }
}

export async function updatePatientRecord(request: Request, response: Response): Promise<void> {
  try {
    const patient = await updatePatient(
      request.params.patientId as string,
      patientSchema.parse(request.body),
      authContext(request),
    );
    if (!patient) {
      response.status(404).json({ message: 'Patient not found' });
      return;
    }
    await recordAuditEvent({
      actorUserId: authContext(request).userId,
      action: 'patient.updated',
      resourceType: 'Patient',
      resourceId: patient._id.toString(),
      patientId: patient._id.toString(),
    });
    response.status(200).json({ patient });
  } catch (error) {
    handlePatientError(error, response);
  }
}
