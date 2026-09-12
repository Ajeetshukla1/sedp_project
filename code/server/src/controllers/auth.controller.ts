import { type Request, type Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { getCurrentUser, login, refreshSession, register } from '../services/auth.service.js';
import { loginSchema, registerSchema } from '../validators/auth.validators.js';
import { type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { recordAuditEvent } from '../services/audit.service.js';
import { type RequestWithId } from '../middleware/request-id.middleware.js';

export const refreshCookieName = 'refreshToken';

function setRefreshCookie(response: Response, token: string): void {
  response.cookie(refreshCookieName, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

function clearRefreshCookie(response: Response): void {
  response.clearCookie(refreshCookieName, { httpOnly: true, sameSite: 'lax', path: '/api/auth' });
}

function handleAuthError(error: unknown, response: Response): void {
  if (error instanceof z.ZodError) {
    response.status(400).json({ message: 'Invalid request data', issues: error.issues });
    return;
  }
  if (error instanceof Error && error.message === 'EMAIL_IN_USE') {
    response.status(409).json({ message: 'Email is already registered' });
    return;
  }
  response.status(401).json({ message: 'Invalid credentials or session' });
}

export async function registerUser(request: Request, response: Response): Promise<void> {
  try {
    const result = await register(registerSchema.parse(request.body));
    await recordAuditEvent({
      actorUserId: result.user.id,
      action: 'auth.registered',
      resourceType: 'User',
      resourceId: result.user.id,
      requestId: (request as RequestWithId).requestId,
    }).catch(() => undefined);
    setRefreshCookie(response, result.refreshToken);
    response.status(201).json({ user: result.user, accessToken: result.accessToken });
  } catch (error) {
    handleAuthError(error, response);
  }
}

export async function loginUser(request: Request, response: Response): Promise<void> {
  try {
    const result = await login(loginSchema.parse(request.body));
    await recordAuditEvent({
      actorUserId: result.user.id,
      action: 'auth.logged_in',
      resourceType: 'User',
      resourceId: result.user.id,
      requestId: (request as RequestWithId).requestId,
    }).catch(() => undefined);
    setRefreshCookie(response, result.refreshToken);
    response.status(200).json({ user: result.user, accessToken: result.accessToken });
  } catch (error) {
    handleAuthError(error, response);
  }
}

export async function refreshUserSession(request: Request, response: Response): Promise<void> {
  try {
    const token = request.cookies?.[refreshCookieName];
    if (!token) throw new Error('INVALID_SESSION');
    const result = await refreshSession(token);
    await recordAuditEvent({
      actorUserId: result.user.id,
      action: 'auth.session_refreshed',
      resourceType: 'User',
      resourceId: result.user.id,
      requestId: (request as RequestWithId).requestId,
    }).catch(() => undefined);
    setRefreshCookie(response, result.refreshToken);
    response.status(200).json({ user: result.user, accessToken: result.accessToken });
  } catch (error) {
    handleAuthError(error, response);
  }
}

export function logoutUser(request: Request, response: Response): void {
  const auth = (request as Request & { auth?: { userId: string } }).auth;
  if (auth)
    void recordAuditEvent({
      actorUserId: auth.userId,
      action: 'auth.logged_out',
      resourceType: 'User',
      resourceId: auth.userId,
      requestId: (request as RequestWithId).requestId,
    }).catch(() => undefined);
  clearRefreshCookie(response);
  response.status(204).send();
}

export async function currentUser(request: Request, response: Response): Promise<void> {
  try {
    const user = await getCurrentUser((request as AuthenticatedRequest).auth.userId);
    response.status(200).json({ user });
  } catch {
    response.status(401).json({ message: 'Invalid session' });
  }
}
