import type { CookieOptions, Request, Response } from 'express';
import { z } from 'zod';
import { isProd } from '../config/env.js';
import { loginUser, registerUser, signSession } from '../services/auth.service.js';
import { findUserById } from '../services/user.service.js';
import { AppError } from '../utils/errors.js';

const cookieBase: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
};

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  email: z.string().trim().toLowerCase().email('Invalid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email.'),
  password: z.string().min(1, 'Password is required.'),
});

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new AppError(400, result.error.issues[0]?.message ?? 'Invalid input.');
  }
  return result.data;
}

const setSession = (res: Response, token: string) =>
  res.cookie('session', token, { ...cookieBase, maxAge: 7 * 24 * 60 * 60 * 1000 });

export async function registerHandler(req: Request, res: Response) {
  const { name, email, password } = parse(registerSchema, req.body);
  const user = await registerUser(name, email, password);
  setSession(res, signSession(user));
  res.status(201).json({ user });
}

export async function loginHandler(req: Request, res: Response) {
  const { email, password } = parse(loginSchema, req.body);
  const user = await loginUser(email, password);
  setSession(res, signSession(user));
  res.json({ user });
}

export function logoutHandler(_req: Request, res: Response) {
  res.clearCookie('session', cookieBase);
  res.json({ success: true });
}

export async function meHandler(req: Request, res: Response) {
  const user = await findUserById(req.user!.id);
  if (!user) {
    throw new AppError(401, 'User no longer exists.');
  }
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
}
