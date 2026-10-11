import { prisma } from '../config/prisma.js';
import { getProvider } from '../providers/registry.js';
import type { CloudFile } from '../providers/types.js';
import { decrypt } from '../utils/crypto.js';
import { calculateSha256 } from './fingerprint.service.js';
import {
  countNativeDuplicateGroups,
  findDuplicateGroups,
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

export async function runMultiAccountScan(
  accounts: AccountScanTarget[],
  onProgress: (progress: ScanProgress) => void,
  control: ScanControl,
) {
  // List every account before grouping so duplicates can span connected accounts.
  const allFiles: CloudFile[] = [];
  let scannedCount = 0;
  let cancelled = false;

  try {
    for (const acc of accounts) {
      const provider = getProvider(acc.provider);
      const refreshToken = decrypt(acc.refreshTokenEnc);

      for await (const page of provider.listFiles(refreshToken)) {
        // Pause and cancellation take effect between provider pages, not mid-request.
        await control.checkpoint();

        const decorated = page.map((file) => ({
          ...file,
          accountId: acc.id,
          accountEmail: acc.accountEmail,
          provider: acc.provider,
        }));

        allFiles.push(...decorated);
        scannedCount += decorated.length;

        onProgress({
          scannedCount,
          duplicatesCount: 0,
          currentProvider: acc.provider,
          currentAccount: acc.accountEmail,
        });
      }
    }
  } catch (error) {
    if (!(error instanceof ScanCancelledError)) throw error;
    cancelled = true;
  }

  if (cancelled) {
    const nativeDuplicateCount = countNativeDuplicateGroups(allFiles);

    return {
      totalScanned: scannedCount,
      duplicateGroups: [],
      cancelled: true,
      nativeDuplicateGroups: nativeDuplicateCount,
    };
  }

  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const sha256Cache = new Map<string, string>();

  const calculateFileSha256 = async (file: CloudFile): Promise<string> => {
    const cacheKey = `${file.accountId ?? ''}:${file.id}`;
    const cached = sha256Cache.get(cacheKey);

    if (cached) return cached;

    if (!file.accountId) {
      throw new Error(`Missing account ID for file ${file.id}`);
    }

    const account = accountsById.get(file.accountId);

    if (!account) {
      throw new Error(`Cloud account not found for file ${file.id}`);
    }

    await control.checkpoint();

    // Cache per account/file because IDs may collide across providers or accounts.
    const provider = getProvider(account.provider);
    const refreshToken = decrypt(account.refreshTokenEnc);
    const { stream } = await provider.streamFile(refreshToken, file.id);

    const sha256 = await calculateSha256(stream);

    await control.checkpoint();

    sha256Cache.set(cacheKey, sha256);

    return sha256;
  };

  const duplicateGroups = await findDuplicateGroups(
    allFiles,
    calculateFileSha256,
  );

  onProgress({
    scannedCount,
    duplicatesCount: duplicateGroups.length,
    currentProvider: '',
    currentAccount: '',
  });

  return {
    totalScanned: scannedCount,
    duplicateGroups,
    cancelled: false,
  };
}