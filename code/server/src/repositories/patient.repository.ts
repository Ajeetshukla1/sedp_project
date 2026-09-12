import { randomInt } from 'node:crypto';
import { DoctorPatientAccess } from '../models/DoctorPatientAccess.js';
import { Patient, type PatientDocument } from '../models/Patient.js';
import { type PatientInput } from '../validators/patient.validators.js';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function createPatient(
  input: PatientInput,
  userId?: string,
): Promise<PatientDocument> {
  return Patient.create({ ...input, dateOfBirth: new Date(input.dateOfBirth), userId });
}

export async function findPatientById(patientId: string): Promise<PatientDocument | null> {
  return Patient.findById(patientId);
}

export async function findPatientByUserId(userId: string): Promise<PatientDocument | null> {
  return Patient.findOne({ userId });
}

export async function findAllPatients(search?: string): Promise<PatientDocument[]> {
  const query = search
    ? {
        $or: [
          { firstName: new RegExp(escapeRegex(search), 'i') },
          { lastName: new RegExp(escapeRegex(search), 'i') },
          { patientCode: new RegExp(escapeRegex(search), 'i') },
        ],
      }
    : {};
  return Patient.find(query).sort({ lastName: 1, firstName: 1 });
}

export async function findPatientsForDoctor(
  doctorId: string,
  search?: string,
): Promise<PatientDocument[]> {
  const accessRecords = await DoctorPatientAccess.find({ doctorId, status: 'active' }).select(
    'patientId',
  );
  const patientIds = accessRecords.map((record) => record.patientId);
  const query = search
    ? {
        _id: { $in: patientIds },
        $or: [
          { firstName: new RegExp(escapeRegex(search), 'i') },
          { lastName: new RegExp(escapeRegex(search), 'i') },
          { patientCode: new RegExp(escapeRegex(search), 'i') },
        ],
      }
    : { _id: { $in: patientIds } };
  return Patient.find(query).sort({ lastName: 1, firstName: 1 });
}

export async function grantDoctorAccess(doctorId: string, patientId: string): Promise<void> {
  await DoctorPatientAccess.findOneAndUpdate(
    { doctorId, patientId },
    { $set: { status: 'active', grantedAt: new Date(), revokedAt: undefined } },
    { upsert: true },
  );
}

export async function hasDoctorAccess(doctorId: string, patientId: string): Promise<boolean> {
  return Boolean(await DoctorPatientAccess.exists({ doctorId, patientId, status: 'active' }));
}

export async function listPatientDoctorAccess(patientId: string) {
  return DoctorPatientAccess.find({ patientId })
    .populate('doctorId', 'name email')
    .sort({ status: 1, grantedAt: -1 });
}

export async function revokeDoctorAccess(doctorId: string, patientId: string): Promise<boolean> {
  const result = await DoctorPatientAccess.updateOne(
    { doctorId, patientId, status: 'active' },
    { $set: { status: 'revoked', revokedAt: new Date() } },
  );
  return result.modifiedCount > 0;
}

export async function getOrCreateDoctorAccessCode(patientId: string): Promise<string | null> {
  const patient = await Patient.findById(patientId);
  if (!patient) return null;
  if (patient.doctorAccessCode) return patient.doctorAccessCode;

  let code = '';
  do {
    code = `DR-${randomInt(10000, 100000)}`;
  } while (await Patient.exists({ doctorAccessCode: code }));

  patient.doctorAccessCode = code;
  await patient.save();
  return code;
}
