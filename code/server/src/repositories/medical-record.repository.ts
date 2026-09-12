import { Types } from 'mongoose';
import { Allergy } from '../models/Allergy.js';
import { Condition } from '../models/Condition.js';
import { Encounter } from '../models/Encounter.js';
import { Medication } from '../models/Medication.js';
import { Observation } from '../models/Observation.js';
import {
  type AllergyInput,
  type ConditionInput,
  type EncounterInput,
  type MedicationInput,
  type ObservationInput,
} from '../validators/medical-record.validators.js';

const patientObjectId = (patientId: string): Types.ObjectId => new Types.ObjectId(patientId);

export async function createEncounter(patientId: string, doctorId: string, input: EncounterInput) {
  return Encounter.create({
    ...input,
    patientId: patientObjectId(patientId),
    doctorId,
    occurredAt: new Date(input.occurredAt),
  });
}
export function listEncounters(patientId: string) {
  return Encounter.find({ patientId }).sort({ occurredAt: -1 });
}
export function updateEncounter(patientId: string, recordId: string, input: EncounterInput) {
  return Encounter.findOneAndUpdate(
    { _id: recordId, patientId },
    { ...input, occurredAt: new Date(input.occurredAt) },
    { new: true, runValidators: true },
  );
}
export function deleteEncounter(patientId: string, recordId: string) {
  return Encounter.findOneAndDelete({ _id: recordId, patientId });
}

export async function createCondition(patientId: string, input: ConditionInput) {
  return Condition.create({
    ...input,
    patientId: patientObjectId(patientId),
    diagnosedAt: input.diagnosedAt ? new Date(input.diagnosedAt) : undefined,
    resolvedAt: input.resolvedAt ? new Date(input.resolvedAt) : undefined,
  });
}
export function listConditions(patientId: string) {
  return Condition.find({ patientId }).sort({ diagnosedAt: -1, createdAt: -1 });
}
export function updateCondition(patientId: string, recordId: string, input: ConditionInput) {
  return Condition.findOneAndUpdate(
    { _id: recordId, patientId },
    {
      ...input,
      diagnosedAt: input.diagnosedAt ? new Date(input.diagnosedAt) : undefined,
      resolvedAt: input.resolvedAt ? new Date(input.resolvedAt) : undefined,
    },
    { new: true, runValidators: true },
  );
}
export function deleteCondition(patientId: string, recordId: string) {
  return Condition.findOneAndDelete({ _id: recordId, patientId });
}

export async function createMedication(patientId: string, input: MedicationInput) {
  return Medication.create({
    ...input,
    patientId: patientObjectId(patientId),
    startDate: input.startDate ? new Date(input.startDate) : undefined,
    endDate: input.endDate ? new Date(input.endDate) : undefined,
  });
}
export function listMedications(patientId: string) {
  return Medication.find({ patientId }).sort({ status: 1, startDate: -1, createdAt: -1 });
}
export function updateMedication(patientId: string, recordId: string, input: MedicationInput) {
  return Medication.findOneAndUpdate(
    { _id: recordId, patientId },
    {
      ...input,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    },
    { new: true, runValidators: true },
  );
}
export function deleteMedication(patientId: string, recordId: string) {
  return Medication.findOneAndDelete({ _id: recordId, patientId });
}

export async function createAllergy(patientId: string, input: AllergyInput) {
  return Allergy.create({
    ...input,
    patientId: patientObjectId(patientId),
    recordedAt: new Date(input.recordedAt),
  });
}
export function listAllergies(patientId: string) {
  return Allergy.find({ patientId }).sort({ recordedAt: -1 });
}
export function updateAllergy(patientId: string, recordId: string, input: AllergyInput) {
  return Allergy.findOneAndUpdate(
    { _id: recordId, patientId },
    { ...input, recordedAt: new Date(input.recordedAt) },
    { new: true, runValidators: true },
  );
}
export function deleteAllergy(patientId: string, recordId: string) {
  return Allergy.findOneAndDelete({ _id: recordId, patientId });
}

export async function createObservation(patientId: string, input: ObservationInput) {
  return Observation.create({
    ...input,
    patientId: patientObjectId(patientId),
    observedAt: new Date(input.observedAt),
  });
}
export function listObservations(patientId: string) {
  return Observation.find({ patientId }).sort({ observedAt: -1 });
}
export function updateObservation(patientId: string, recordId: string, input: ObservationInput) {
  return Observation.findOneAndUpdate(
    { _id: recordId, patientId },
    { ...input, observedAt: new Date(input.observedAt) },
    { new: true, runValidators: true },
  );
}
export function deleteObservation(patientId: string, recordId: string) {
  return Observation.findOneAndDelete({ _id: recordId, patientId });
}
