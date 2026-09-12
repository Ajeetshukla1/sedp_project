import { createContext } from 'react';
import { type LoginRole, type User } from '../../api/authApi';

export type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string, role: LoginRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: LoginRole) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
