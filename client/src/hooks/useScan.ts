import { useDuplicateGroups } from './useDuplicateGroups';
import { useScanSession } from './useScanSession';
import type { DuplicateGroup } from '../types/cloud';

export { ScanMode } from '../types/scan';

/** Composes scan-session state with duplicate-group and deletion state. */
export function useScan() {
  const duplicateGroups = useDuplicateGroups();
  const scanSession = useScanSession((data: { duplicateGroups: DuplicateGroup[] }) => {
    duplicateGroups.replaceGroups(data.duplicateGroups);
  });

  const reset = () => {
    duplicateGroups.resetGroups();
    scanSession.reset();
  };

  const startScan = (accountId: string) => {
    duplicateGroups.resetGroups();
    scanSession.startScan(accountId);
  };

  const startScanAll = () => {
    duplicateGroups.resetGroups();
    scanSession.startScanAll();
  };

  return {
    groups: duplicateGroups.groups,
    deleting: duplicateGroups.deleting,
    duplicateFilesCount: duplicateGroups.duplicateFilesCount,
    deleteFile: duplicateGroups.deleteFile,
    deleteDuplicates: duplicateGroups.deleteDuplicates,
    ...scanSession,
    startScan,
    startScanAll,
    reset,
  };
}