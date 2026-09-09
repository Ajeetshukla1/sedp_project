import { Schema, Types, model } from 'mongoose';

const allergySchema = new Schema(
  {
    patientId: { type: Types.ObjectId, ref: 'Patient', required: true, index: true },
    substance: { type: String, required: true, trim: true },
    reaction: { type: String, trim: true },
    status: {
      type: String,
      enum: ['active', 'resolved', 'unknown'],
      required: true,
      default: 'unknown',
    },
    sourceDocumentId: { type: Types.ObjectId, ref: 'Document' },
    recordedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export const Allergy = model('Allergy', allergySchema);
