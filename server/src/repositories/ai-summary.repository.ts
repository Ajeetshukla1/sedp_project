import { AISummary } from '../models/AISummary.js';

export function createAISummary(input: Record<string, unknown>) {
  return AISummary.create(input);
}
export function listAISummaries(patientId: string) {
  return AISummary.find({ patientId }).sort({ generatedAt: -1 });
}
export function findAISummary(patientId: string, summaryId: string) {
  return AISummary.findOne({ _id: summaryId, patientId });
}
export function findAISummaryById(summaryId: string) {
  return AISummary.findById(summaryId);
}
