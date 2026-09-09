import { createHash, randomUUID } from 'node:crypto';
import { getStorageProvider } from './storage.service.js';

export function createDocumentChecksum(contents: Buffer): string {
  return createHash('sha256').update(contents).digest('hex');
}

export function createStorageKey(patientId: string, mimeType: string): string {
  const extension =
    mimeType === 'application/pdf' ? 'pdf' : mimeType === 'image/png' ? 'png' : 'jpg';
  return `${patientId}/${randomUUID()}.${extension}`;
}

export function saveDocument(storageKey: string, contents: Buffer): Promise<void> {
  return getStorageProvider().save(storageKey, contents);
}

export function readDocument(storageKey: string): Promise<Buffer> {
  return getStorageProvider().read(storageKey);
}

export function removeDocument(storageKey: string): Promise<void> {
  return getStorageProvider().remove(storageKey);
}
