import { Schema, Types, model } from 'mongoose';

const auditLogSchema = new Schema(
  {
    actorUserId: { type: Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    resourceType: { type: String, required: true },
    resourceId: { type: String, required: true },
    patientId: { type: Types.ObjectId, ref: 'Patient' },
    requestId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ actorUserId: 1, createdAt: -1 });
auditLogSchema.index({ patientId: 1, createdAt: -1 });

export const AuditLog = model('AuditLog', auditLogSchema);
