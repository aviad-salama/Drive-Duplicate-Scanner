import { prisma } from '../config/prisma.js';

export const findUserByEmail = (email: string) => prisma.user.findUnique({ where: { email } });

export const findUserById = (id: string) => prisma.user.findUnique({ where: { id } });

export const createUser = (data: { email: string; passwordHash: string; name: string }) =>
  prisma.user.create({ data });