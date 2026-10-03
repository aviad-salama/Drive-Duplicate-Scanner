import { prisma } from '../config/prisma.js';
import type { CloudProvider } from '../providers/types.js';
import { addToGroups, countDuplicateGroups, toDuplicateGroups, type ChecksumGroups } from './duplicate.service.js';

export interface ScanProgress {
  scannedCount: number;
  duplicatesCount: number;
}

export async function runScan(
  provider: CloudProvider,
  refreshToken: string,
  onProgress: (progress: ScanProgress) => void,
) {
  const groups: ChecksumGroups = new Map();
  let scannedCount = 0;

  for await (const page of provider.listFiles(refreshToken)) {
    scannedCount += page.length;
    addToGroups(groups, page);
    onProgress({ scannedCount, duplicatesCount: countDuplicateGroups(groups) });
  }

  return { totalScanned: scannedCount, duplicateGroups: toDuplicateGroups(groups) };
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