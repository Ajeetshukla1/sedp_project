export const userRoles = ['patient', 'doctor', 'admin'] as const;

export type UserRole = (typeof userRoles)[number];
