import { type Request, type Response } from 'express';
import { type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { reportMetadataSchema } from '../validators/report.validators.js';
import * as service from '../services/report.service.js';
import { readDocument } from '../services/document.service.js';

function authUserId(request: Request): string {
  return (request as AuthenticatedRequest).auth.userId;
}
function patientId(request: Request): string {
  return request.params.patientId as string;
}

export async function uploadReport(request: Request, response: Response): Promise<void> {
  if (!request.file) {
    response.status(400).json({ message: 'A report file is required' });
    return;
  }
  try {
    const metadata = reportMetadataSchema.parse(request.body);
    const report = await service.uploadReport(
      patientId(request),
      authUserId(request),
      request.file,
      metadata,
    );
    response.status(201).json({ report });
  } catch (error) {
    if (error instanceof Error && error.message === 'DUPLICATE_DOCUMENT') {
      response.status(409).json({ message: 'This document was already uploaded for the patient' });
      return;
    }
    response.status(400).json({ message: 'Invalid report metadata or upload' });
  }
}

export async function listReports(request: Request, response: Response): Promise<void> {
  response.json({ reports: await service.listReports(patientId(request)) });
}

export async function downloadReport(request: Request, response: Response): Promise<void> {
  const found = await service.getReport(patientId(request), request.params.reportId as string);
  if (!found) {
    response.status(404).json({ message: 'Report not found' });
    return;
  }
  try {
    const contents = await readDocument(found.document.storageKey);
    response
      .type(found.document.mimeType)
      .attachment(found.document.originalFileName)
      .send(contents);
  } catch {
    response.status(404).json({ message: 'Report file not found' });
  }
}

export async function deleteReport(request: Request, response: Response): Promise<void> {
  const removed = await service.removeReport(patientId(request), request.params.reportId as string);
  response.status(removed ? 204 : 404).send();
}
