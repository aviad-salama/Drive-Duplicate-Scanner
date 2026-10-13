import { useEffect, useRef, useState } from 'react';
import { providerLabel } from '../config/providers';
import {
  controlScan,
  deleteFile as deleteFileApi,
  scanAllUrl,
  scanUrl,
  type ScanAction,
} from '../services/cloudService';
import type { CloudFile, DuplicateGroup } from '../types/cloud';
import { he } from '../languages/he';

export type ScanMode = 'single' | 'all';

/** Owns the EventSource lifecycle and UI state for single- and multi-account scans. */
export function useScan() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [displayScanned, setDisplayScanned] = useState(0);
  const sourceRef = useRef<EventSource | null>(null);
  const scanIdRef = useRef<string | null>(null);
  const [scanState, setScanState] = useState({
    scanning: false,
    paused: false,
    cancelled: false,
    mode: 'single' as ScanMode,
    currentAccount: '',
    deleting: false,
    error: '',
    targetScanned: 0,
    liveDuplicates: 0,
  });
   



  // Animate the file counter.
  useEffect(() => {
    if (!scanState.scanning || displayScanned >= scanState.targetScanned) {
      return;
    }
    const interval = setInterval(() => {
      setDisplayScanned((prev) => {
        const diff = scanState.targetScanned - prev;
        if (diff <= 0) {
          return scanState.targetScanned;
        }
        return prev + Math.max(1, Math.ceil(diff / 8));
      });
    }, 30);
    return () => clearInterval(interval);
  }, [displayScanned, scanState.targetScanned, scanState.scanning]);

  // Closing the connection also cancels the scan on the server.
  useEffect(() => () => sourceRef.current?.close(), []);

  const reset = () => {
    sourceRef.current?.close();
    sourceRef.current = null;
    scanIdRef.current = null;
    setGroups([]);
    setDisplayScanned(0);
    // איפוס קל ומהיר של כל הסטייטים
    setScanState({
      scanning: false,
      paused: false,
      cancelled: false,
      mode: 'single',
      currentAccount: '',
      deleting: false,
      error: '',
      targetScanned: 0,
      liveDuplicates: 0,
    });
  };

  // Shared by the single-account and all-accounts scans.
  const run = (url: string, nextMode: ScanMode) => {
    reset();
    setScanState(prev => ({ ...prev, scanning: true, mode: nextMode }));
  

    const es = new EventSource(url, { withCredentials: true });
    sourceRef.current = es;

    const finish = (data: { duplicateGroups: DuplicateGroup[]; totalScanned: number }, wasCancelled: boolean) => {
      setGroups(data.duplicateGroups);
      setDisplayScanned(data.totalScanned);
      setScanState(prev => ({
        ...prev,
        targetScanned: data.totalScanned,
        cancelled: wasCancelled,
        scanning: false,
        paused: false,
      }));
      scanIdRef.current = null;
      es.close();
    };

    // The server sends a started event first, then progress and one terminal event.
    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'started') {
        scanIdRef.current = data.scanId;
      } else if (data.type === 'progress') {
        setScanState(prev => ({
          ...prev,
          targetScanned: data.scannedCount,
          liveDuplicates: data.duplicatesCount,
          currentAccount: `${providerLabel(data.currentProvider)} – ${data.currentAccount}`,
        }));
      } else if (data.type === 'complete') {
        finish(data, false);
      } else if (data.type === 'cancelled') {
        finish(data, true);
      } else if (data.type === 'error') {
        setScanState(prev => ({ ...prev, error: data.message, scanning: false, paused: false }));
        es.close();
      }
    };

    es.onerror = () => {
      setScanState(prev => ({ ...prev, error: he.errors.scanConnection, scanning: false, paused: false }));
      es.close();
    };
  };

  const startScan = (accountId: string) => run(scanUrl(accountId), 'single');
  const startScanAll = () => run(scanAllUrl(), 'all');

  const sendControl = async (action: ScanAction) => {
    const id = scanIdRef.current;
    if (!id) {
      return false;
    }
    try {
      await controlScan(id, action);
      return true;
    } catch {
      return false;
    }
  };

  const pause = async () => {
    if (await sendControl('pause')) {
      setScanState(prev => ({ ...prev, paused: true }));
    }
  };

  const resume = async () => {
    if (await sendControl('resume')) {
      setScanState(prev => ({ ...prev, paused: false }));
    }
  };

  // The server answers with a "cancelled" event that finalizes the UI.
  // If the server no longer knows this scan, fall back to a local reset.
  const cancel = async () => {
    if (!(await sendControl('cancel'))) {
      reset();
    }
  };

  const getFileKey = (file: CloudFile) =>
  `${file.accountId ?? ''}:${file.id}`;

const removeFromGroups = (file: CloudFile) => {
  const targetKey = getFileKey(file);

  setGroups((prev) =>
    prev
      .map((group) => ({
        ...group,
        files: group.files.filter((current) => getFileKey(current) !== targetKey),
      }))
      .filter((group) => group.files.length > 1),
  );
};

    const deleteFile = async (file: CloudFile) => {
    if (!file.accountId) {
      return false;
    }

    // 1. Snapshot previous state for a potential rollback (Optimistic Update Pattern)
    const previousGroups = [...groups];

    // 2. Optimistically update UI immediately (before API call finishes)
    removeFromGroups(file);

    try {
      // 3. Perform actual API call in the background
      await deleteFileApi(file.accountId, file.id);
      return true;
    } catch {
      // 4. Rollback to the snapshot if the server request fails
      setGroups(previousGroups);
      return false;
    }
  };

  const deleteDuplicates = async (filesToDelete: CloudFile[]) => {
    setScanState(prev => ({ ...prev, deleting: true }));
    let success = 0;
    let failed = 0;
    for (const file of filesToDelete) {
      if (await deleteFile(file)) {
        success++;
      } else {
        failed++;
      }
    }
    setScanState(prev => ({ ...prev, deleting: false }));
    return { success, failed };
  };

  const duplicateFilesCount = groups.reduce((acc, g) => acc + g.files.length - 1, 0);

  return {
    groups,
    ...scanState,
    displayScanned,
    duplicateFilesCount,
    startScan,
    startScanAll,
    pause,
    resume,
    cancel,
    reset,
    deleteFile,
    deleteDuplicates,
  };
}