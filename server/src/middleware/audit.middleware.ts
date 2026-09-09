import { type NextFunction, type Request, type Response } from 'express';
import { type AuthenticatedRequest } from './auth.middleware.js';
import { type RequestWithId } from './request-id.middleware.js';
import { recordAuditEvent } from '../services/audit.service.js';

export function auditSensitiveResponse(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  response.once('finish', () => {
    if (response.statusCode < 200 || response.statusCode >= 300) return;
    const auth = (request as AuthenticatedRequest).auth;
    const patientId = request.params.patientId as string | undefined;
    if (!auth || !patientId) return;
    const resourceType = request.path.split('/').filter(Boolean)[0] ?? 'Patient';
    void recordAuditEvent({
      actorUserId: auth.userId,
      action: `patient.${request.method.toLowerCase()}`,
      resourceType,
      resourceId: (request.params.recordId as string | undefined) ?? patientId,
      patientId,
      requestId: (request as RequestWithId).requestId,
    }).catch(() => undefined);
  });
  next();
}
