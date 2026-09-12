import { randomUUID } from 'node:crypto';
import { type NextFunction, type Request, type Response } from 'express';

export type RequestWithId = Request & { requestId: string };

export function requestIdMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const requestWithId = request as RequestWithId;
  requestWithId.requestId = request.get('x-request-id') ?? randomUUID();
  response.setHeader('x-request-id', requestWithId.requestId);
  next();
}
