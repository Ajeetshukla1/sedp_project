import { randomUUID } from 'node:crypto';
import { Schema, Types, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const patientSchema = new Schema(
  {
    patientCode: {
      type: String,
      required: true,
      unique: true,
      default: () => `PT-${randomUUID().slice(0, 8).toUpperCase()}`,
    },
    doctorAccessCode: { type: String, unique: true, sparse: true },
    userId: { type: Types.ObjectId, ref: 'User' },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    sex: { type: String, enum: ['female', 'male', 'intersex', 'unknown'], required: true },
    contact: {
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      address: { type: String, trim: true },
    },
  },
  { timestamps: true },
);

patientSchema.index({ lastName: 1, firstName: 1 });

export type PatientDocument = HydratedDocument<InferSchemaType<typeof patientSchema>>;
export const Patient = model('Patient', patientSchema);
