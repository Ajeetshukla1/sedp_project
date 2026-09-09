import { type UserRole } from '@digital-health/shared/enums';
import {
  findAllPatients,
  findPatientById,
  findPatientByUserId,
  findPatientsForDoctor,
  grantDoctorAccess,
  hasDoctorAccess,
  createPatient as createPatientRecord,
} from '../repositories/patient.repository.js';
import { type PatientDocument } from '../models/Patient.js';
import { type PatientInput } from '../validators/patient.validators.js';

export type AuthContext = { userId: string; role: UserRole };

export async function createPatient(
  input: PatientInput,
  auth: AuthContext,
): Promise<PatientDocument> {
  const patient = await createPatientRecord(
    input,
    auth.role === 'patient' ? auth.userId : undefined,
  );
  if (auth.role === 'doctor') await grantDoctorAccess(auth.userId, patient._id.toString());
  return patient;
}

export async function listPatients(auth: AuthContext, search?: string): Promise<PatientDocument[]> {
  if (auth.role === 'doctor') return findPatientsForDoctor(auth.userId, search);
  if (auth.role === 'patient') {
    const patient = await findPatientByUserId(auth.userId);
    return patient ? [patient] : [];
  }
  return findAllPatients(search);
}

export async function getPatient(
  patientId: string,
  auth: AuthContext,
): Promise<PatientDocument | null> {
  const patient = await findPatientById(patientId);
  if (!patient) return null;
  if (auth.role === 'admin' || patient.userId?.toString() === auth.userId) return patient;
  if (auth.role === 'doctor' && (await hasDoctorAccess(auth.userId, patientId))) return patient;
  throw new Error('FORBIDDEN');
}

export async function updatePatient(
  patientId: string,
  input: PatientInput,
  auth: AuthContext,
): Promise<PatientDocument | null> {
  const patient = await getPatient(patientId, auth);
  if (!patient) return null;
  Object.assign(patient, { ...input, dateOfBirth: new Date(input.dateOfBirth) });
  await patient.save();
  return patient;
}
