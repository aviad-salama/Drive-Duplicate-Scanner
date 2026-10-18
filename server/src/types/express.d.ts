import type { CloudProvider } from '../providers/types.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
      cloud?: { accountId: string; provider: CloudProvider; refreshToken: string };
    }
  }
}

export {};
