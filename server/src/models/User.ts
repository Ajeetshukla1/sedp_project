import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { userRoles } from '@digital-health/shared/enums';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: userRoles, required: true, default: 'patient' },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });

export type UserDocument = HydratedDocument<InferSchemaType<typeof userSchema>>;
export const User = model('User', userSchema);
