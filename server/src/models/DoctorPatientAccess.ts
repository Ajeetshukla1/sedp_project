import { Schema, Types, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const doctorPatientAccessSchema = new Schema(
  {
    doctorId: { type: Types.ObjectId, ref: 'User', required: true },
    patientId: { type: Types.ObjectId, ref: 'Patient', required: true },
    status: { type: String, enum: ['active', 'revoked'], required: true, default: 'active' },
    grantedAt: { type: Date, required: true, default: Date.now },
    revokedAt: { type: Date },
  },
  { timestamps: true },
);

doctorPatientAccessSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });
doctorPatientAccessSchema.index({ doctorId: 1, status: 1 });

export type DoctorPatientAccessDocument = HydratedDocument<
  InferSchemaType<typeof doctorPatientAccessSchema>
>;
export const DoctorPatientAccess = model('DoctorPatientAccess', doctorPatientAccessSchema);
