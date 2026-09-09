import { Schema, Types, model } from 'mongoose';

const medicationSchema = new Schema(
  {
    patientId: { type: Types.ObjectId, ref: 'Patient', required: true, index: true },
    name: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true },
    frequency: { type: String, trim: true },
    route: { type: String, trim: true },
    status: {
      type: String,
      enum: ['active', 'discontinued', 'completed', 'unknown'],
      required: true,
      default: 'unknown',
    },
    startDate: { type: Date },
    endDate: { type: Date },
    sourceDocumentId: { type: Types.ObjectId, ref: 'Document' },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

export const Medication = model('Medication', medicationSchema);
