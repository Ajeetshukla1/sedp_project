import * as repository from '../repositories/timeline.repository.js';
import { calculateTrends } from './trend.service.js';
import { detectConflicts } from './conflict.service.js';

export async function getPatientTimeline(patientId: string) {
  const [encounters, conditions, medications, allergies, observations, reports] =
    await repository.findPatientTimelineRecords(patientId);
  const events = [
    ...encounters.map((record) => ({
      id: record._id.toString(),
      type: 'encounter',
      occurredAt: record.occurredAt,
      title: record.type,
      detail: record.reason,
      sourceIds: [],
    })),
    ...conditions.map((record) => ({
      id: record._id.toString(),
      type: 'condition',
      occurredAt: record.diagnosedAt ?? record.createdAt,
      title: record.name,
      detail: record.status,
      sourceIds: record.sourceDocumentId ? [record.sourceDocumentId.toString()] : [],
    })),
    ...medications.map((record) => ({
      id: record._id.toString(),
      type: 'medication',
      occurredAt: record.startDate ?? record.createdAt,
      title: record.name,
      detail: record.status,
      sourceIds: record.sourceDocumentId ? [record.sourceDocumentId.toString()] : [],
    })),
    ...allergies.map((record) => ({
      id: record._id.toString(),
      type: 'allergy',
      occurredAt: record.recordedAt,
      title: record.substance,
      detail: record.status,
      sourceIds: record.sourceDocumentId ? [record.sourceDocumentId.toString()] : [],
    })),
    ...observations.map((record) => ({
      id: record._id.toString(),
      type: 'observation',
      occurredAt: record.observedAt,
      title: record.normalizedName,
      detail: `${record.value} ${record.unit}`,
      sourceIds: record.sourceDocumentId ? [record.sourceDocumentId.toString()] : [],
    })),
    ...reports.map((record) => ({
      id: record._id.toString(),
      type: 'report',
      occurredAt: record.clinicalEventDate,
      title: record.reportType,
      detail: record.processingStatus,
      sourceIds: [record._id.toString()],
    })),
  ].sort(
    (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
  );
  return {
    events,
    trends: calculateTrends(
      observations.map((record) => ({
        id: record._id.toString(),
        normalizedName: record.normalizedName,
        value: record.value,
        unit: record.unit,
        observedAt: record.observedAt,
      })),
    ),
    conflicts: detectConflicts(
      allergies.map((record) => ({
        id: record._id.toString(),
        name: record.substance,
        status: record.status,
      })),
      medications.map((record) => ({
        id: record._id.toString(),
        name: record.name,
        status: record.status,
      })),
      observations.map((record) => ({
        id: record._id.toString(),
        normalizedName: record.normalizedName,
        value: record.value,
        unit: record.unit,
        observedAt: record.observedAt,
      })),
    ),
  };
}
