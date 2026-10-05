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

export type ScanMode = 'single' | 'all';

export function useScan() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [scanning, setScanning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [mode, setMode] = useState<ScanMode>('single');
  const [currentAccount, setCurrentAccount] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [targetScanned, setTargetScanned] = useState(0);
  const [displayScanned, setDisplayScanned] = useState(0);
  const [liveDuplicates, setLiveDuplicates] = useState(0);
  const sourceRef = useRef<EventSource | null>(null);
  const scanIdRef = useRef<string | null>(null);

  // Animate the file counter.
  useEffect(() => {
    if (!scanning || displayScanned >= targetScanned) return;
    const interval = setInterval(() => {
      setDisplayScanned((prev) => {
        const diff = targetScanned - prev;
        if (diff <= 0) return targetScanned;
        return prev + Math.max(1, Math.ceil(diff / 8));
      });
    }, 30);
    return () => clearInterval(interval);
  }, [displayScanned, targetScanned, scanning]);

  // Closing the connection also cancels the scan on the server.
  useEffect(() => () => sourceRef.current?.close(), []);

  const reset = () => {
    sourceRef.current?.close();
    sourceRef.current = null;
    scanIdRef.current = null;
    setGroups([]);
    setScanning(false);
    setPaused(false);
    setCancelled(false);
    setCurrentAccount('');
    setError('');
    setTargetScanned(0);
    setDisplayScanned(0);
    setLiveDuplicates(0);
  };

  // Shared by the single-account and all-accounts scans.
  const run = (url: string, nextMode: ScanMode) => {
    reset();
    setMode(nextMode);
    setScanning(true);

    const es = new EventSource(url, { withCredentials: true });
    sourceRef.current = es;

    const finish = (data: { duplicateGroups: DuplicateGroup[]; totalScanned: number }, wasCancelled: boolean) => {
      setGroups(data.duplicateGroups);
      setTargetScanned(data.totalScanned);
      setDisplayScanned(data.totalScanned);
      setCancelled(wasCancelled);
      setScanning(false);
      setPaused(false);
      scanIdRef.current = null;
      es.close();
    };

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'started') {
        scanIdRef.current = data.scanId;
      } else if (data.type === 'progress') {
        setTargetScanned(data.scannedCount);
        setLiveDuplicates(data.duplicatesCount);
        setCurrentAccount(`${providerLabel(data.currentProvider)} – ${data.currentAccount}`);
      } else if (data.type === 'complete') {
        finish(data, false);
      } else if (data.type === 'cancelled') {
        finish(data, true);
      } else if (data.type === 'error') {
        setError(data.message);
        setScanning(false);
        setPaused(false);
        es.close();
      }
    };

    es.onerror = () => {
      setError('שגיאת חיבור לשרת. נסה להתחבר מחדש.');
      setScanning(false);
      setPaused(false);
      es.close();
    };
  };

  const startScan = (accountId: string) => run(scanUrl(accountId), 'single');
  const startScanAll = () => run(scanAllUrl(), 'all');

  const sendControl = async (action: ScanAction) => {
    const id = scanIdRef.current;
    if (!id) return false;
    try {
      await controlScan(id, action);
      return true;
    } catch {
      return false;
    }
  };

  const pause = async () => {
    if (await sendControl('pause')) setPaused(true);
  };

  const resume = async () => {
    if (await sendControl('resume')) setPaused(false);
  };

  // The server answers with a "cancelled" event that finalizes the UI.
  // If the server no longer knows this scan, fall back to a local reset.
  const cancel = async () => {
    if (!(await sendControl('cancel'))) reset();
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
    // Every scanned file carries its own accountId.
    if (!file.accountId) return false;
    try {
      await deleteFileApi(file.accountId, file.id);
      removeFromGroups(file);
      return true;
    } catch {
      return false;
    }
  };

  // Keep the first (largest) file in each group and delete the rest.
  const deleteDuplicates = async () => {
    setDeleting(true);
    let success = 0;
    let failed = 0;
    for (const file of groups.flatMap((g) => g.files.slice(1))) {
      if (await deleteFile(file)) success++;
      else failed++;
    }
    setDeleting(false);
    return { success, failed };
  };

  const duplicateFilesCount = groups.reduce((acc, g) => acc + g.files.length - 1, 0);

  return {
    groups,
    scanning,
    paused,
    cancelled,
    mode,
    currentAccount,
    deleting,
    error,
    displayScanned,
    liveDuplicates,
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