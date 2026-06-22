import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../lib/api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  profilePicture?: string | null;
  bio?: string | null;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    api
      .get<{ user: User }>('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  async function login(username: string, password: string) {
    const { user, jwt } = await api.post<{ user: User; jwt: string }>('/auth/login', {
      username,
      password,
    });
    localStorage.setItem('token', jwt);
    setToken(jwt);
    setUser(user);
  }

  async function register(data: RegisterData) {
    const { user, jwt } = await api.post<{ user: User; jwt: string }>('/auth/register', data);
    localStorage.setItem('token', jwt);
    setToken(jwt);
    setUser(user);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
