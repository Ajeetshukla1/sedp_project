import { Router } from 'express';
import { requirePatientAccess } from '../middleware/patient-access.middleware.js';
import * as controller from '../controllers/medical-record.controller.js';
import { auditSensitiveResponse } from '../middleware/audit.middleware.js';

export const medicalRecordRouter = Router({ mergeParams: true });
medicalRecordRouter.use(requirePatientAccess);
medicalRecordRouter.use(auditSensitiveResponse);

const resources = [
  [
    'encounters',
    controller.listEncounters,
    controller.createEncounter,
    controller.updateEncounter,
    controller.deleteEncounter,
  ],
  [
    'conditions',
    controller.listConditions,
    controller.createCondition,
    controller.updateCondition,
    controller.deleteCondition,
  ],
  [
    'medications',
    controller.listMedications,
    controller.createMedication,
    controller.updateMedication,
    controller.deleteMedication,
  ],
  [
    'allergies',
    controller.listAllergies,
    controller.createAllergy,
    controller.updateAllergy,
    controller.deleteAllergy,
  ],
  [
    'observations',
    controller.listObservations,
    controller.createObservation,
    controller.updateObservation,
    controller.deleteObservation,
  ],
] as const;

for (const [path, list, create, update, remove] of resources) {
  medicalRecordRouter.get(`/${path}`, list);
  medicalRecordRouter.post(`/${path}`, create);
  medicalRecordRouter.patch(`/${path}/:recordId`, update);
  medicalRecordRouter.delete(`/${path}/:recordId`, remove);
}
