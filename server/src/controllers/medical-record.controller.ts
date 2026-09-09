import { type Request, type Response } from 'express';
import { type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { canWriteMedicalRecord } from '../services/medical-record.service.js';
import * as service from '../services/medical-record.service.js';
import {
  encounterSchema,
  conditionSchema,
  medicationSchema,
  allergySchema,
  observationSchema,
} from '../validators/medical-record.validators.js';

type Auth = { userId: string; role: 'patient' | 'doctor' | 'admin' };
function context(request: Request): Auth {
  return (request as AuthenticatedRequest).auth as Auth;
}
function patientId(request: Request): string {
  return request.params.patientId as string;
}
function recordId(request: Request): string {
  return request.params.recordId as string;
}
function invalid(response: Response): void {
  response.status(400).json({ message: 'Invalid medical record request' });
}
function forbidden(response: Response): void {
  response.status(403).json({ message: 'Only doctors and admins can modify medical records' });
}

export async function listEncounters(request: Request, response: Response): Promise<void> {
  response.json({ encounters: await service.listEncounters(patientId(request)) });
}
export async function createEncounter(request: Request, response: Response): Promise<void> {
  if (!canWriteMedicalRecord(context(request))) return forbidden(response);
  try {
    response.status(201).json({
      encounter: await service.createEncounter(
        patientId(request),
        context(request),
        encounterSchema.parse(request.body),
      ),
    });
  } catch {
    invalid(response);
  }
}
export async function updateEncounter(request: Request, response: Response): Promise<void> {
  if (!canWriteMedicalRecord(context(request))) return forbidden(response);
  try {
    const encounter = await service.updateEncounter(
      patientId(request),
      recordId(request),
      encounterSchema.parse(request.body),
    );
    if (!encounter) {
      response.status(404).json({ message: 'Encounter not found' });
      return;
    }
    response.json({ encounter });
  } catch {
    invalid(response);
  }
}
export async function deleteEncounter(request: Request, response: Response): Promise<void> {
  if (!canWriteMedicalRecord(context(request))) return forbidden(response);
  const record = await service.deleteEncounter(patientId(request), recordId(request));
  response.status(record ? 204 : 404).send();
}

export async function listConditions(request: Request, response: Response): Promise<void> {
  response.json({ conditions: await service.listConditions(patientId(request)) });
}
export async function createCondition(request: Request, response: Response): Promise<void> {
  if (!canWriteMedicalRecord(context(request))) return forbidden(response);
  try {
    response.status(201).json({
      condition: await service.createCondition(
        patientId(request),
        conditionSchema.parse(request.body),
      ),
    });
  } catch {
    invalid(response);
  }
}
export async function updateCondition(request: Request, response: Response): Promise<void> {
  if (!canWriteMedicalRecord(context(request))) return forbidden(response);
  try {
    const condition = await service.updateCondition(
      patientId(request),
      recordId(request),
      conditionSchema.parse(request.body),
    );
    if (!condition) {
      response.status(404).json({ message: 'Condition not found' });
      return;
    }
    response.json({ condition });
  } catch {
    invalid(response);
  }
}
export async function deleteCondition(request: Request, response: Response): Promise<void> {
  if (!canWriteMedicalRecord(context(request))) return forbidden(response);
  const record = await service.deleteCondition(patientId(request), recordId(request));
  response.status(record ? 204 : 404).send();
}

export async function listMedications(request: Request, response: Response): Promise<void> {
  response.json({ medications: await service.listMedications(patientId(request)) });
}
export async function createMedication(request: Request, response: Response): Promise<void> {
  if (!canWriteMedicalRecord(context(request))) return forbidden(response);
  try {
    response.status(201).json({
      medication: await service.createMedication(
        patientId(request),
        medicationSchema.parse(request.body),
      ),
    });
  } catch {
    invalid(response);
  }
}
export async function updateMedication(request: Request, response: Response): Promise<void> {
  if (!canWriteMedicalRecord(context(request))) return forbidden(response);
  try {
    const medication = await service.updateMedication(
      patientId(request),
      recordId(request),
      medicationSchema.parse(request.body),
    );
    if (!medication) {
      response.status(404).json({ message: 'Medication not found' });
      return;
    }
    response.json({ medication });
  } catch {
    invalid(response);
  }
}
export async function deleteMedication(request: Request, response: Response): Promise<void> {
  if (!canWriteMedicalRecord(context(request))) return forbidden(response);
  const record = await service.deleteMedication(patientId(request), recordId(request));
  response.status(record ? 204 : 404).send();
}

export async function listAllergies(request: Request, response: Response): Promise<void> {
  response.json({ allergies: await service.listAllergies(patientId(request)) });
}
export async function createAllergy(request: Request, response: Response): Promise<void> {
  if (!canWriteMedicalRecord(context(request))) return forbidden(response);
  try {
    response.status(201).json({
      allergy: await service.createAllergy(patientId(request), allergySchema.parse(request.body)),
    });
  } catch {
    invalid(response);
  }
}
export async function updateAllergy(request: Request, response: Response): Promise<void> {
  if (!canWriteMedicalRecord(context(request))) return forbidden(response);
  try {
    const allergy = await service.updateAllergy(
      patientId(request),
      recordId(request),
      allergySchema.parse(request.body),
    );
    if (!allergy) {
      response.status(404).json({ message: 'Allergy not found' });
      return;
    }
    response.json({ allergy });
  } catch {
    invalid(response);
  }
}
export async function deleteAllergy(request: Request, response: Response): Promise<void> {
  if (!canWriteMedicalRecord(context(request))) return forbidden(response);
  const record = await service.deleteAllergy(patientId(request), recordId(request));
  response.status(record ? 204 : 404).send();
}

export async function listObservations(request: Request, response: Response): Promise<void> {
  response.json({ observations: await service.listObservations(patientId(request)) });
}
export async function createObservation(request: Request, response: Response): Promise<void> {
  if (!canWriteMedicalRecord(context(request))) return forbidden(response);
  try {
    response.status(201).json({
      observation: await service.createObservation(
        patientId(request),
        observationSchema.parse(request.body),
      ),
    });
  } catch {
    invalid(response);
  }
}
export async function updateObservation(request: Request, response: Response): Promise<void> {
  if (!canWriteMedicalRecord(context(request))) return forbidden(response);
  try {
    const observation = await service.updateObservation(
      patientId(request),
      recordId(request),
      observationSchema.parse(request.body),
    );
    if (!observation) {
      response.status(404).json({ message: 'Observation not found' });
      return;
    }
    response.json({ observation });
  } catch {
    invalid(response);
  }
}
export async function deleteObservation(request: Request, response: Response): Promise<void> {
  if (!canWriteMedicalRecord(context(request))) return forbidden(response);
  const record = await service.deleteObservation(patientId(request), recordId(request));
  response.status(record ? 204 : 404).send();
}
