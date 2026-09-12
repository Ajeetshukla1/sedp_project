import { useEffect, useState, type JSX, type ReactNode } from 'react';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
  type LoginRole,
  type User,
} from '../../api/authApi';
import { AuthContext } from './authContext';

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession(): Promise<void> {
      try {
        const refreshed = await refreshSession();
        setAccessToken(refreshed.accessToken);
        setUser(refreshed.user);
        await getCurrentUser(refreshed.accessToken);
      } catch {
        setUser(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    }
    void restoreSession();
  }, []);

  async function login(email: string, password: string, role: LoginRole): Promise<void> {
    const result = await loginUser({ email, password, role });
    setAccessToken(result.accessToken);
    setUser(result.user);
  }

  async function register(
    name: string,
    email: string,
    password: string,
    role: LoginRole,
  ): Promise<void> {
    const result = await registerUser({ name, email, password, role });
    setAccessToken(result.accessToken);
    setUser(result.user);
  }

  async function logout(): Promise<void> {
    if (accessToken) await logoutUser(accessToken);
    setUser(null);
    setAccessToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
