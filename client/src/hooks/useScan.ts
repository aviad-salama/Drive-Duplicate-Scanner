import { useEffect, useRef, useState } from 'react';
import { deleteFile as deleteFileApi, scanUrl } from '../services/cloudService';
import type { CloudFile, DuplicateGroup } from '../types/cloud';

export function useScan(accountId: string | null) {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [scanning, setScanning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [targetScanned, setTargetScanned] = useState(0);
  const [displayScanned, setDisplayScanned] = useState(0);
  const [liveDuplicates, setLiveDuplicates] = useState(0);
  const sourceRef = useRef<EventSource | null>(null);

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

  // Close the SSE connection when leaving the page.
  useEffect(() => () => sourceRef.current?.close(), []);

  const reset = () => {
    sourceRef.current?.close();
    setGroups([]);
    setScanning(false);
    setError('');
    setTargetScanned(0);
    setDisplayScanned(0);
    setLiveDuplicates(0);
  };

  const startScan = () => {
    if (!accountId) return;
    reset();
    setScanning(true);

    const es = new EventSource(scanUrl(accountId), { withCredentials: true });
    sourceRef.current = es;

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'progress') {
        setTargetScanned(data.scannedCount);
        setLiveDuplicates(data.duplicatesCount);
      } else if (data.type === 'complete') {
        setGroups(data.duplicateGroups);
        setTargetScanned(data.totalScanned);
        setDisplayScanned(data.totalScanned);
        setScanning(false);
        es.close();
      } else if (data.type === 'error') {
        setError(data.message);
        setScanning(false);
        es.close();
      }
    };

    es.onerror = () => {
      setError('שגיאת חיבור לשרת. נסה להתחבר מחדש.');
      setScanning(false);
      es.close();
    };
  };

  const removeFromGroups = (fileId: string) =>
    setGroups((prev) =>
      prev
        .map((g) => ({ ...g, files: g.files.filter((f) => f.id !== fileId) }))
        .filter((g) => g.files.length > 1),
    );

  const deleteFile = async (file: CloudFile) => {
    if (!accountId) return false;
    try {
      await deleteFileApi(accountId, file.id);
      removeFromGroups(file.id);
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
    deleting,
    error,
    displayScanned,
    liveDuplicates,
    duplicateFilesCount,
    startScan,
    reset,
    deleteFile,
    deleteDuplicates,
  };
}