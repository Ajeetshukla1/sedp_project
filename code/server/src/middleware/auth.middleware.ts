import { type NextFunction, type Request, type Response } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';

export type AuthenticatedRequest = Request & { auth: { userId: string; role: string } };

export function requireAuth(request: Request, response: Response, next: NextFunction): void {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    response.status(401).json({ message: 'Authentication required' });
    return;
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    (request as AuthenticatedRequest).auth = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    response.status(401).json({ message: 'Invalid or expired access token' });
  }
}
