import { prisma } from '../config/prisma.js';
import { encrypt } from '../utils/crypto.js';
import type { ConnectedAccountInfo } from '../providers/types.js';

export function saveCloudAccount(userId: string, provider: string, info: ConnectedAccountInfo) {
  const refreshTokenEnc = encrypt(info.refreshToken);
  return prisma.cloudAccount.upsert({
    where: {
      userId_provider_providerAccountId: {
        userId,
        provider,
        providerAccountId: info.providerAccountId,
      },
    },
    update: { accountEmail: info.accountEmail, refreshTokenEnc },
    create: {
      userId,
      provider,
      providerAccountId: info.providerAccountId,
      accountEmail: info.accountEmail,
      refreshTokenEnc,
    },
  });
}

// Never return the token to the client.
export const listCloudAccounts = (userId: string) =>
  prisma.cloudAccount.findMany({
    where: { userId },
    select: { id: true, provider: true, accountEmail: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

// Always verify that the account belongs to the user.
export const getCloudAccountForUser = (id: string, userId: string) =>
  prisma.cloudAccount.findFirst({ where: { id, userId } });

export const deleteCloudAccount = (id: string, userId: string) =>
  prisma.cloudAccount.deleteMany({ where: { id, userId } });