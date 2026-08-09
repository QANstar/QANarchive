import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { AuthResponse, UserInfo } from '../api/types';

interface AuthContextValue {
  user: UserInfo | null;
  token: string | null;
  login: (account: string, password: string) => Promise<void>;
  register: (account: string, userName: string, password: string, inviteCode: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(() => {
    const raw = localStorage.getItem('qan_user');
    return raw ? JSON.parse(raw) as UserInfo : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('qan_token'));

  useEffect(() => {
    if (token) localStorage.setItem('qan_token', token);
    else localStorage.removeItem('qan_token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('qan_user', JSON.stringify(user));
    else localStorage.removeItem('qan_user');
  }, [user]);

  const applyAuth = (res: AuthResponse) => {
    setToken(res.token);
    setUser(res.user);
  };

  const login = async (account: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/login', { account, password });
    applyAuth(res.data);
  };

  const register = async (account: string, userName: string, password: string, inviteCode: string) => {
    const res = await api.post<AuthResponse>('/auth/register', { account, userName, password, inviteCode });
    applyAuth(res.data);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
