import { Allergy } from '../models/Allergy.js';
import { Condition } from '../models/Condition.js';
import { Encounter } from '../models/Encounter.js';
import { Medication } from '../models/Medication.js';
import { Observation } from '../models/Observation.js';
import { MedicalReport } from '../models/MedicalReport.js';

export async function findPatientTimelineRecords(patientId: string) {
  return Promise.all([
    Encounter.find({ patientId }).lean(),
    Condition.find({ patientId }).lean(),
    Medication.find({ patientId }).lean(),
    Allergy.find({ patientId }).lean(),
    Observation.find({ patientId }).lean(),
    MedicalReport.find({ patientId }).lean(),
  ]);
}
