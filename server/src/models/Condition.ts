import { Schema, Types, model } from 'mongoose';

const conditionSchema = new Schema(
  {
    patientId: { type: Types.ObjectId, ref: 'Patient', required: true, index: true },
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['active', 'resolved', 'unknown'],
      required: true,
      default: 'unknown',
    },
    diagnosedAt: { type: Date },
    resolvedAt: { type: Date },
    notes: { type: String, trim: true },
    sourceDocumentId: { type: Types.ObjectId, ref: 'Document' },
  },
  { timestamps: true },
);

export const Condition = model('Condition', conditionSchema);
