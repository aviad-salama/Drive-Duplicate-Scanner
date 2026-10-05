import { prisma } from '../config/prisma.js';
import { getProvider } from '../providers/registry.js';
import { decrypt } from '../utils/crypto.js';
import {
  addToGroups,
  countDuplicateGroups,
  toDuplicateGroups,
  type ChecksumGroups,
} from './duplicate.service.js';
import { ScanCancelledError, type ScanControl } from './scanControl.service.js';

export interface ScanProgress {
  scannedCount: number;
  duplicatesCount: number;
  currentProvider: string;
  currentAccount: string;
}

export interface AccountScanTarget {
  id: string;
  provider: string;
  accountEmail: string;
  refreshTokenEnc: string;
}

export const createScan = (userId: string, cloudAccountId: string) =>
  prisma.scan.create({ data: { userId, cloudAccountId } });

export const finishScan = (
  id: string,
  status: 'COMPLETED' | 'FAILED',
  totalScanned = 0,
  duplicateGroups = 0,
) =>
  prisma.scan.update({
    where: { id },
    data: { status, totalScanned, duplicateGroups, finishedAt: new Date() },
  });

// Used for both a single account and all accounts, so every file always
// carries its account context (needed for the cloud badge and thumbnails).
export async function runMultiAccountScan(
  accounts: AccountScanTarget[],
  onProgress: (progress: ScanProgress) => void,
  control: ScanControl,
) {
  const groups: ChecksumGroups = new Map();
  let scannedCount = 0;
  let cancelled = false;

  try {
    for (const acc of accounts) {
      const provider = getProvider(acc.provider);
      const refreshToken = decrypt(acc.refreshTokenEnc);

      for await (const page of provider.listFiles(refreshToken)) {
        // Blocks while paused and throws if the scan was cancelled.
        await control.checkpoint();

        const decorated = page.map((f) => ({
          ...f,
          accountId: acc.id,
          accountEmail: acc.accountEmail,
          provider: acc.provider,
        }));

        scannedCount += decorated.length;
        addToGroups(groups, decorated);
        onProgress({
          scannedCount,
          duplicatesCount: countDuplicateGroups(groups),
          currentProvider: acc.provider,
          currentAccount: acc.accountEmail,
        });
      }
    }
  } catch (error) {
    if (!(error instanceof ScanCancelledError)) throw error;
    cancelled = true; // Return the partial results found so far.
  }

  return { totalScanned: scannedCount, duplicateGroups: toDuplicateGroups(groups), cancelled };
}