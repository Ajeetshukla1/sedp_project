import { Document } from '../models/Document.js';
import { MedicalReport } from '../models/MedicalReport.js';
import { Observation } from '../models/Observation.js';

export function findDuplicateDocument(patientId: string, checksum: string) {
  return Document.findOne({ patientId, checksum });
}
export function createDocument(input: Record<string, unknown>) {
  return Document.create(input);
}
export function createMedicalReport(input: Record<string, unknown>) {
  return MedicalReport.create(input);
}
export function listMedicalReports(patientId: string) {
  return MedicalReport.find({ patientId })
    .populate('documentId', 'originalFileName mimeType sizeBytes checksum extractionStatus')
    .sort({ clinicalEventDate: -1 });
}
export function findMedicalReport(patientId: string, reportId: string) {
  return MedicalReport.findOne({ _id: reportId, patientId }).populate('documentId');
}
export function deleteDocument(documentId: string) {
  return Document.findByIdAndDelete(documentId);
}
export function deleteMedicalReport(reportId: string) {
  return MedicalReport.findByIdAndDelete(reportId);
}
export function updateDocument(documentId: string, input: Record<string, unknown>) {
  return Document.findByIdAndUpdate(documentId, input, { new: true });
}
export function updateMedicalReport(reportId: string, input: Record<string, unknown>) {
  return MedicalReport.findByIdAndUpdate(reportId, input, { new: true });
}
export function createExtractedObservation(input: Record<string, unknown>) {
  return Observation.create(input);
}
