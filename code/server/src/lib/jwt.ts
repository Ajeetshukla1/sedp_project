import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { type UserRole } from '@digital-health/shared/enums';
import { env } from '../config/env.js';

export type AuthTokenPayload = JwtPayload & { sub: string; role: UserRole };

function createToken(userId: string, role: UserRole, secret: string, expiresIn: string): string {
  return jwt.sign({ sub: userId, role, jti: randomUUID() }, secret, {
    expiresIn: expiresIn as SignOptions['expiresIn'],
  });
}

export function createAccessToken(userId: string, role: UserRole): string {
  return createToken(userId, role, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRES_IN);
}

export function createRefreshToken(userId: string, role: UserRole): string {
  return createToken(userId, role, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN);
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthTokenPayload;
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthTokenPayload;
}
