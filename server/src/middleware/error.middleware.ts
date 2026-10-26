import type { NextFunction, Request, Response } from 'express';
import { AppError, CloudAuthorizationError, isCloudAuthorizationFailure } from '../utils/errors.js';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (isCloudAuthorizationFailure(err)) {
    let provider = req.cloud?.provider.id;
    let accountId = req.cloud?.accountId;
    let accountEmail: string | undefined;

    if (err instanceof CloudAuthorizationError) {
      provider = err.provider;
      accountId = err.accountId;
      accountEmail = err.accountEmail;
    }

    if (provider && accountId) {
      res.status(401).json({
        code: 'CLOUD_REAUTH_REQUIRED',
        error: 'Cloud authorization expired or was revoked.',
        provider,
        accountId,
        accountEmail,
      });
      return;
    }
  }

  if (err instanceof AppError) {
    res.status(err.status).json({ code: err.code, error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
}
