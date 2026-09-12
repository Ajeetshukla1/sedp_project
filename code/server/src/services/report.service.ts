import { type Express } from 'express';
import { type ReportMetadata } from '../validators/report.validators.js';
import * as repository from '../repositories/report.repository.js';
import {
  createDocumentChecksum,
  createStorageKey,
  removeDocument,
  saveDocument,
} from './document.service.js';
import { extractText } from './extraction.service.js';
import { normalizeObservations } from './normalization.service.js';

export async function uploadReport(
  patientId: string,
  userId: string,
  file: Express.Multer.File,
  metadata: ReportMetadata,
) {
  const checksum = createDocumentChecksum(file.buffer);
  if (await repository.findDuplicateDocument(patientId, checksum))
    throw new Error('DUPLICATE_DOCUMENT');
  const storageKey = createStorageKey(patientId, file.mimetype);
  await saveDocument(storageKey, file.buffer);
  try {
    const document = await repository.createDocument({
      patientId,
      uploadedBy: userId,
      originalFileName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storageKey,
      checksum,
      extractionStatus: 'pending',
    });
    const report = await repository.createMedicalReport({
      patientId,
      documentId: document._id,
      reportType: metadata.reportType,
      clinicalEventDate: new Date(metadata.clinicalEventDate),
      notes: metadata.notes,
      processingStatus: 'uploaded',
    });
    return processReport(
      report._id.toString(),
      document._id.toString(),
      patientId,
      file.buffer,
      file.mimetype,
    );
  } catch (error) {
    await removeDocument(storageKey).catch(() => undefined);
    throw error;
  }
}

export async function processReport(
  reportId: string,
  documentId: string,
  patientId: string,
  contents: Buffer,
  mimeType: string,
) {
  await repository.updateMedicalReport(reportId, { processingStatus: 'processing' });
  try {
    const extractedText = await extractText(contents, mimeType);
    const observations = normalizeObservations(extractedText);
    await repository.updateDocument(documentId, {
      extractedText,
      extractionStatus: 'completed',
      processedAt: new Date(),
    });
    await Promise.all(
      observations.map((observation) =>
        repository.createExtractedObservation({
          ...observation,
          patientId,
          sourceDocumentId: documentId,
          extractionStatus: 'extracted',
          observedAt: new Date(),
        }),
      ),
    );
    return repository.updateMedicalReport(reportId, { processingStatus: 'processed' });
  } catch (error) {
    const message =
      error instanceof Error ? error.message.slice(0, 500) : 'Document extraction failed';
    await repository.updateDocument(documentId, {
      extractionStatus: 'failed',
      extractionError: message,
      processedAt: new Date(),
    });
    return repository.updateMedicalReport(reportId, { processingStatus: 'failed' });
  }
}

export function listReports(patientId: string) {
  return repository.listMedicalReports(patientId);
}
export async function getReport(patientId: string, reportId: string) {
  const report = await repository.findMedicalReport(patientId, reportId);
  if (!report) return null;
  const document = report.documentId as unknown as {
    _id: string;
    storageKey: string;
    mimeType: string;
    originalFileName: string;
  };
  return { report, document };
}

export async function removeReport(patientId: string, reportId: string): Promise<boolean> {
  const found = await getReport(patientId, reportId);
  if (!found) return false;
  await removeDocument(found.document.storageKey).catch(() => undefined);
  await repository.deleteMedicalReport(reportId);
  await repository.deleteDocument(found.document._id.toString());
  return true;
}
