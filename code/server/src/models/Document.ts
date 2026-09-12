import { Schema, Types, model } from 'mongoose';

const documentSchema = new Schema(
  {
    patientId: { type: Types.ObjectId, ref: 'Patient', required: true, index: true },
    uploadedBy: { type: Types.ObjectId, ref: 'User', required: true },
    originalFileName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    storageKey: { type: String, required: true, unique: true },
    checksum: { type: String, required: true },
    extractionStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      required: true,
      default: 'pending',
    },
    extractedText: { type: String },
    extractionError: { type: String },
    processedAt: { type: Date },
  },
  { timestamps: true },
);

documentSchema.index({ patientId: 1, checksum: 1 }, { unique: true });
export const Document = model('Document', documentSchema);
