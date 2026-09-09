import { Schema, Types, model } from 'mongoose';

const observationSchema = new Schema(
  {
    patientId: { type: Types.ObjectId, ref: 'Patient', required: true, index: true },
    type: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    value: { type: Number, required: true },
    unit: { type: String, required: true, trim: true },
    referenceLow: { type: Number },
    referenceHigh: { type: Number },
    observedAt: { type: Date, required: true },
    sourceDocumentId: { type: Types.ObjectId, ref: 'Document' },
    extractionStatus: {
      type: String,
      enum: ['extracted', 'needs_review', 'verified'],
      required: true,
      default: 'verified',
    },
  },
  { timestamps: true },
);

export const Observation = model('Observation', observationSchema);
