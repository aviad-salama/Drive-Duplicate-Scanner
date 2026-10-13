import { useEffect, useRef, useState } from 'react';
import { providerLabel } from '../config/providers';
import {
  controlScan,
  scanAllUrl,
  scanUrl,
  type ScanAction,
} from '../services/cloudService';
import type { DuplicateGroup } from '../types/cloud';
import { he } from '../languages/he';

export type ScanMode = 'single' | 'all';

type ScanResult = {
  duplicateGroups: DuplicateGroup[];
  totalScanned: number;
};

type ScanFinishedHandler = (data: ScanResult) => void;

/** Owns the EventSource lifecycle, progress state, and scan controls. */
export function useScanSession(onFinished: ScanFinishedHandler) {
  const [displayScanned, setDisplayScanned] = useState(0);
  const sourceRef = useRef<EventSource | null>(null);
  const scanIdRef = useRef<string | null>(null);
  const [scanState, setScanState] = useState({
    scanning: false,
    paused: false,
    cancelled: false,
    mode: 'single' as ScanMode,
    currentAccount: '',
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
    setDisplayScanned(0);
    // איפוס קל ומהיר של כל הסטייטים
    setScanState({
      scanning: false,
      paused: false,
      cancelled: false,
      mode: 'single',
      currentAccount: '',
      error: '',
      targetScanned: 0,
      liveDuplicates: 0,
    });
  };

  // Shared by the single-account and all-accounts scans.
  const run = (url: string, nextMode: ScanMode) => {
    reset();
    setScanState((prev) => ({ ...prev, scanning: true, mode: nextMode }));

    const es = new EventSource(url, { withCredentials: true });
    sourceRef.current = es;

    const finish = (data: ScanResult, wasCancelled: boolean) => {
      onFinished(data);
      setDisplayScanned(data.totalScanned);
      setScanState((prev) => ({
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
        setScanState((prev) => ({
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
        setScanState((prev) => ({ ...prev, error: data.message, scanning: false, paused: false }));
        es.close();
      }
    };

    es.onerror = () => {
      setScanState((prev) => ({ ...prev, error: he.errors.scanConnection, scanning: false, paused: false }));
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
      setScanState((prev) => ({ ...prev, paused: true }));
    }
  };

  const resume = async () => {
    if (await sendControl('resume')) {
      setScanState((prev) => ({ ...prev, paused: false }));
    }
  };

  // The server answers with a "cancelled" event that finalizes the UI.
  // If the server no longer knows this scan, fall back to a local reset.
  const cancel = async () => {
    if (!(await sendControl('cancel'))) {
      reset();
    }
  };

  return {
    ...scanState,
    displayScanned,
    startScan,
    startScanAll,
    pause,
    resume,
    cancel,
    reset,
  };
}
