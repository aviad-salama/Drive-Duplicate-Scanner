import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { createUser, findUserByEmail } from './user.service.js';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
}

const toPublic = (u: { id: string; email: string; name: string }): PublicUser => ({
  id: u.id,
  email: u.email,
  name: u.name,
});

export async function registerUser(name: string, email: string, password: string) {
  if (await findUserByEmail(email)) {
    throw new AppError(409, 'Email address is already in use.');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  return toPublic(await createUser({ name, email, passwordHash }));
}

export async function loginUser(email: string, password: string) {
  const user = await findUserByEmail(email);
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !valid) {
    throw new AppError(401, 'Invalid credentials.');
  }
  return toPublic(user);
}

export const signSession = (user: PublicUser) =>
  jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '7d' });

// Short-lived state for cloud connections (identifies the user and protects against CSRF).
export const signOAuthState = (userId: string, provider: string) =>
  jwt.sign({ userId, provider }, env.JWT_SECRET, { expiresIn: '10m' });

export function verifyOAuthState(state: string): { userId: string; provider: string } {
  try {
    return jwt.verify(state, env.JWT_SECRET) as { userId: string; provider: string };
  } catch {
    throw new AppError(400, 'Invalid or expired OAuth state');
  }
}
