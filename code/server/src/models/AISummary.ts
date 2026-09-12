import { Schema, Types, model } from 'mongoose';

const aiSummarySchema = new Schema(
  {
    patientId: { type: Types.ObjectId, ref: 'Patient', required: true, index: true },
    generatedBy: { type: Types.ObjectId, ref: 'User', required: true },
    model: { type: String, required: true },
    status: { type: String, enum: ['processing', 'completed', 'failed'], required: true },
    summary: { type: Schema.Types.Mixed },
    sourceIds: { type: [String], required: true, default: [] },
    generatedAt: { type: Date },
    errorCode: { type: String },
  },
  { timestamps: true },
);

export const AISummary = model('AISummary', aiSummarySchema);
