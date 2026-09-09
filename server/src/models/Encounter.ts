import { Schema, Types, model } from 'mongoose';

const encounterSchema = new Schema(
  {
    patientId: { type: Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    occurredAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export const Encounter = model('Encounter', encounterSchema);
