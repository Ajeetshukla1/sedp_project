import { http } from './http';

export type UserRole = 'patient' | 'doctor' | 'admin';
export type LoginRole = 'patient' | 'doctor';
export type User = { id: string; name: string; email: string; role: UserRole };
export type AuthResponse = { user: User; accessToken: string };

export function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role: LoginRole;
}): Promise<AuthResponse> {
  return http<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(input) });
}

export function loginUser(input: {
  email: string;
  password: string;
  role: LoginRole;
}): Promise<AuthResponse> {
  return http<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) });
}

export function refreshSession(): Promise<AuthResponse> {
  return http<AuthResponse>('/auth/refresh', { method: 'POST' });
}

export function getCurrentUser(accessToken: string): Promise<{ user: User }> {
  return http<{ user: User }>('/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } });
}

export function logoutUser(accessToken: string): Promise<void> {
  return http<void>('/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
