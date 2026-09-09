import { type NextFunction, type Request, type Response } from 'express';
import { type UserRole } from '@digital-health/shared/enums';
import { type AuthenticatedRequest } from './auth.middleware.js';

export function requireRole(...roles: UserRole[]) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const authenticatedRequest = request as AuthenticatedRequest;
    if (!authenticatedRequest.auth || !roles.includes(authenticatedRequest.auth.role as UserRole)) {
      response.status(403).json({ message: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
