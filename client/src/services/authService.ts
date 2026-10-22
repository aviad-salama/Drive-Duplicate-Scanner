import type { User } from '../types/auth';
import { api } from './apiClient';

const post = (path: string, body: unknown) => api<{ user: User }>(path, { method: 'POST', body: JSON.stringify(body) }).then((r) => r.user);

export const register = (name: string, email: string, password: string) => post('/auth/register', { name, email, password });

export const login = (email: string, password: string) => post('/auth/login', { email, password });

export const logout = () => api<{ success: boolean }>('/auth/logout', { method: 'POST' });

export const me = () => api<{ user: User }>('/auth/me').then((r) => r.user);
