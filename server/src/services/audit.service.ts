import { AuditLog } from '../models/AuditLog.js';

export async function recordAuditEvent(input: {
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  patientId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await AuditLog.create(input);
}
