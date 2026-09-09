import { type AuthContext } from './patient.service.js';
import * as repository from '../repositories/medical-record.repository.js';
import {
  type AllergyInput,
  type ConditionInput,
  type EncounterInput,
  type MedicationInput,
  type ObservationInput,
} from '../validators/medical-record.validators.js';

export function canWriteMedicalRecord(auth: AuthContext): boolean {
  return auth.role === 'doctor' || auth.role === 'admin';
}

export const createEncounter = (patientId: string, auth: AuthContext, input: EncounterInput) =>
  repository.createEncounter(patientId, auth.userId, input);
export const listEncounters = repository.listEncounters;
export const updateEncounter = repository.updateEncounter;
export const deleteEncounter = repository.deleteEncounter;
export const createCondition = repository.createCondition;
export const listConditions = repository.listConditions;
export const updateCondition = repository.updateCondition;
export const deleteCondition = repository.deleteCondition;
export const createMedication = repository.createMedication;
export const listMedications = repository.listMedications;
export const updateMedication = repository.updateMedication;
export const deleteMedication = repository.deleteMedication;
export const createAllergy = repository.createAllergy;
export const listAllergies = repository.listAllergies;
export const updateAllergy = repository.updateAllergy;
export const deleteAllergy = repository.deleteAllergy;
export const createObservation = repository.createObservation;
export const listObservations = repository.listObservations;
export const updateObservation = repository.updateObservation;
export const deleteObservation = repository.deleteObservation;

export type MedicalRecordInput =
  EncounterInput | ConditionInput | MedicationInput | AllergyInput | ObservationInput;
