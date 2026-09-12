import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { env } from '../config/env.js';

export type StorageProvider = {
  save: (key: string, contents: Buffer) => Promise<void>;
  read: (key: string) => Promise<Buffer>;
  remove: (key: string) => Promise<void>;
};

const storageRoot = resolve(process.cwd(), env.STORAGE_LOCAL_PATH);
function localPath(key: string): string {
  return resolve(storageRoot, key);
}

export const localStorageProvider: StorageProvider = {
  async save(key, contents) {
    const path = localPath(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, contents);
  },
  read(key) {
    return readFile(localPath(key));
  },
  remove(key) {
    return unlink(localPath(key));
  },
};

export function getStorageProvider(): StorageProvider {
  if (env.STORAGE_PROVIDER !== 'local')
    throw new Error('S3 storage provider is not configured for this environment');
  return localStorageProvider;
}
