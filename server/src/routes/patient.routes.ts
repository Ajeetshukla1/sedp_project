import { Router } from 'express';
import {
  createPatientRecord,
  getPatientRecord,
  listPatientRecords,
  updatePatientRecord,
} from '../controllers/patient.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requirePatientAccess } from '../middleware/patient-access.middleware.js';
import { medicalRecordRouter } from './medical-record.routes.js';
import { handleReportUpload } from '../middleware/upload.middleware.js';
import {
  deleteReport,
  downloadReport,
  listReports,
  uploadReport,
} from '../controllers/report.controller.js';
import { getTimeline } from '../controllers/timeline.controller.js';
import { aiRouter } from './ai.routes.js';
import { auditSensitiveResponse } from '../middleware/audit.middleware.js';
import {
  createMyDoctorAccessCode,
  listMyDoctorAccess,
  revokeMyDoctorAccess,
} from '../controllers/access.controller.js';

export const patientRouter = Router();
patientRouter.use(requireAuth);
patientRouter.get('/', listPatientRecords);
patientRouter.get('/me/access', listMyDoctorAccess);
patientRouter.post('/me/access-code', createMyDoctorAccessCode);
patientRouter.delete('/me/access/:doctorId', revokeMyDoctorAccess);
patientRouter.post('/', createPatientRecord);
patientRouter.get('/:patientId', requirePatientAccess, getPatientRecord);
patientRouter.patch('/:patientId', requirePatientAccess, updatePatientRecord);
patientRouter.use('/:patientId', medicalRecordRouter);
patientRouter.get('/:patientId/reports', requirePatientAccess, auditSensitiveResponse, listReports);
patientRouter.post(
  '/:patientId/reports',
  requirePatientAccess,
  auditSensitiveResponse,
  handleReportUpload,
  uploadReport,
);
patientRouter.get(
  '/:patientId/reports/:reportId',
  requirePatientAccess,
  auditSensitiveResponse,
  downloadReport,
);
patientRouter.delete(
  '/:patientId/reports/:reportId',
  requirePatientAccess,
  auditSensitiveResponse,
  deleteReport,
);
patientRouter.get('/:patientId/timeline', requirePatientAccess, getTimeline);
patientRouter.use('/:patientId', aiRouter);
