import type { NextFunction, Request, Response } from 'express';
import { getProvider } from '../providers/registry.js';
import { getCloudAccountForUser } from '../services/cloudAccount.service.js';
import { decrypt } from '../utils/crypto.js';
import { AppError } from '../utils/errors.js';

// Load the authenticated user's cloud account and attach it to req.cloud.
export async function attachCloudAccount(req: Request, _res: Response, next: NextFunction) {
  const account = await getCloudAccountForUser(String(req.params.accountId), req.user!.id);
  if (!account) {
    throw new AppError(404, 'Cloud account not found.');
  }
  req.cloud = {
    accountId: account.id,
    provider: getProvider(account.provider),
    refreshToken: decrypt(account.refreshTokenEnc),
  };
  next();
}
