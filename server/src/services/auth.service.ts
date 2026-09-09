import { User, type UserDocument } from '../models/User.js';
import {
  createPatient as createPatientRecord,
  findPatientByUserId,
} from '../repositories/patient.repository.js';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { type LoginInput, type RegisterInput } from '../validators/auth.validators.js';

export type SafeUser = { id: string; name: string; email: string; role: UserDocument['role'] };
export type AuthResult = { user: SafeUser; accessToken: string; refreshToken: string };

function toSafeUser(user: UserDocument): SafeUser {
  return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
}

function createAuthResult(user: UserDocument): AuthResult {
  const safeUser = toSafeUser(user);
  return {
    user: safeUser,
    accessToken: createAccessToken(safeUser.id, safeUser.role),
    refreshToken: createRefreshToken(safeUser.id, safeUser.role),
  };
}

async function ensurePatientRecord(user: UserDocument): Promise<void> {
  if (user.role !== 'patient' || (await findPatientByUserId(user._id.toString()))) return;
  const nameParts = user.name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? 'Patient';
  const lastNameParts = nameParts.slice(1);
  await createPatientRecord(
    {
      firstName,
      lastName: lastNameParts.join(' ') || firstName,
      dateOfBirth: '1990-01-01',
      sex: 'unknown',
      contact: { email: user.email },
    },
    user._id.toString(),
  );
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const email = input.email.toLowerCase();
  if (await User.findOne({ email })) throw new Error('EMAIL_IN_USE');
  const user = await User.create({
    ...input,
    email,
    passwordHash: await hashPassword(input.password),
  });
  await ensurePatientRecord(user as UserDocument);
  return createAuthResult(user as UserDocument);
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await verifyPassword(input.password, user.passwordHash)))
    throw new Error('INVALID_CREDENTIALS');
  if (input.role && user.role !== input.role) throw new Error('INVALID_CREDENTIALS');
  await ensurePatientRecord(user as UserDocument);
  return createAuthResult(user as UserDocument);
}

export async function refreshSession(refreshToken: string): Promise<AuthResult> {
  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.sub);
  if (!user) throw new Error('INVALID_SESSION');
  await ensurePatientRecord(user as UserDocument);
  return createAuthResult(user as UserDocument);
}

export async function getCurrentUser(userId: string): Promise<SafeUser> {
  const user = await User.findById(userId);
  if (!user) throw new Error('INVALID_SESSION');
  return toSafeUser(user as UserDocument);
}
