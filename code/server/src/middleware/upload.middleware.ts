import multer from 'multer';
import { type NextFunction, type Request, type Response } from 'express';
import { env } from '../config/env.js';

const allowedMimeTypes = new Set(['application/pdf', 'image/png', 'image/jpeg']);

export const reportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    callback(null, allowedMimeTypes.has(file.mimetype));
  },
});

export function handleReportUpload(request: Request, response: Response, next: NextFunction): void {
  reportUpload.single('file')(request, response, (error: unknown) => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      response.status(413).json({ message: 'File exceeds the configured upload limit' });
      return;
    }
    response.status(400).json({ message: 'Only PDF, PNG, and JPEG files are supported' });
  });
}
