import { Schema, Types, model } from 'mongoose';

const medicalReportSchema = new Schema(
  {
    patientId: { type: Types.ObjectId, ref: 'Patient', required: true, index: true },
    documentId: { type: Types.ObjectId, ref: 'Document', required: true, unique: true },
    reportType: { type: String, required: true, trim: true },
    clinicalEventDate: { type: Date, required: true },
    notes: { type: String, trim: true },
    processingStatus: {
      type: String,
      enum: ['uploaded', 'processing', 'processed', 'failed'],
      required: true,
      default: 'uploaded',
    },
  },
  { timestamps: true },
);

export const MedicalReport = model('MedicalReport', medicalReportSchema);
