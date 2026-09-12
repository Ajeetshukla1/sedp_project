import { type Request, type Response } from 'express';
import { type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  findPatientByUserId,
  getOrCreateDoctorAccessCode,
  listPatientDoctorAccess,
  revokeDoctorAccess,
} from '../repositories/patient.repository.js';

async function patientIdForRequest(request: Request): Promise<string | null> {
  const userId = (request as AuthenticatedRequest).auth.userId;
  const patient = await findPatientByUserId(userId);
  return patient?._id.toString() ?? null;
}

export async function createMyDoctorAccessCode(
  request: Request,
  response: Response,
): Promise<void> {
  const patientId = await patientIdForRequest(request);
  if (!patientId) {
    response.status(404).json({ message: 'Patient record not found' });
    return;
  }
  const code = await getOrCreateDoctorAccessCode(patientId);
  response.status(200).json({ code });
}

export async function listMyDoctorAccess(request: Request, response: Response): Promise<void> {
  const patientId = await patientIdForRequest(request);
  if (!patientId) {
    response.status(404).json({ message: 'Patient record not found' });
    return;
  }
  const access = await listPatientDoctorAccess(patientId);
  response.status(200).json({ access });
}

export async function revokeMyDoctorAccess(request: Request, response: Response): Promise<void> {
  const patientId = await patientIdForRequest(request);
  if (!patientId) {
    response.status(404).json({ message: 'Patient record not found' });
    return;
  }
  const revoked = await revokeDoctorAccess(request.params.doctorId as string, patientId);
  if (!revoked) {
    response.status(404).json({ message: 'Active doctor access not found' });
    return;
  }
  response.status(204).send();
}
