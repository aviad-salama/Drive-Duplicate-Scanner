import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { getCloudAccountForUser } from '../services/cloudAccount.service.js';
import { createScan, finishScan, runMultiAccountScan } from '../services/scan.service.js';
import { getScanControl, registerScan, unregisterScan } from '../services/scanControl.service.js';

interface ScanErrorDetails {
  name?: unknown;
  code?: unknown;
  status?: unknown;
  response?: { data?: { error?: unknown } };
}

function getSafeScanError(error: unknown) {
  if (!error || typeof error !== 'object') return { name: 'UnknownError' };

  const details = error as ScanErrorDetails;
  return {
    name: typeof details.name === 'string' ? details.name : 'UnknownError',
    code: typeof details.code === 'string' || typeof details.code === 'number' ? details.code : undefined,
    status: typeof details.status === 'number' ? details.status : undefined,
    providerError: typeof details.response?.data?.error === 'string'
      ? details.response.data.error
      : undefined,
  };
}

function getScanFailureMessage(error: unknown, fallback: string) {
  if (getSafeScanError(error).providerError === 'invalid_grant') {
    return 'החיבור לאחד מחשבונות הענן פג או בוטל. נתקו את החשבון, חברו אותו מחדש ונסו שוב.';
  }
  return fallback;
}

// Opens an SSE stream and returns a helper that sends one event.
function openEventStream(res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  return (data: unknown) => res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// SSE: scan a single account.
export async function scanHandler(req: Request, res: Response) {
  const userId = req.user!.id;
  const account = await getCloudAccountForUser(req.cloud!.accountId, userId);
  if (!account) {
    res.status(404).json({ error: 'Cloud account not found.' });
    return;
  }

  const send = openEventStream(res);
  const control = registerScan(userId);
  // Stop the work if the browser disconnects (closed tab, reset, etc.).
  res.on('close', () => control.cancel());
  send({ type: 'started', scanId: control.id });

  const scan = await createScan(userId, account.id);
  try {
    const result = await runMultiAccountScan(
      [account],
      (p) => send({ type: 'progress', ...p }),
      control,
    );
    // A cancelled scan is stored as COMPLETED with its partial counts.
    await finishScan(scan.id, 'COMPLETED', result.totalScanned, result.duplicateGroups.length);
    send({ type: result.cancelled ? 'cancelled' : 'complete', ...result });
  } catch (error) {
    console.error('Scan failed:', getSafeScanError(error));
    await finishScan(scan.id, 'FAILED');
    send({ type: 'error', message: getScanFailureMessage(error, 'Failed to scan drive') });
  } finally {
    unregisterScan(control.id);
    res.end();
  }
}

// SSE: scan every connected account of the user.
export async function scanAllHandler(req: Request, res: Response) {
  const userId = req.user!.id;
  const send = openEventStream(res);
  const control = registerScan(userId);
  res.on('close', () => control.cancel());
  send({ type: 'started', scanId: control.id });

  try {
    const accounts = await prisma.cloudAccount.findMany({ where: { userId } });
    if (accounts.length === 0) {
      send({ type: 'error', message: 'No connected accounts found' });
      return;
    }

    const result = await runMultiAccountScan(
      accounts,
      (p) => send({ type: 'progress', ...p }),
      control,
    );
    send({ type: result.cancelled ? 'cancelled' : 'complete', ...result });
  } catch (error) {
    console.error('Scan all failed:', getSafeScanError(error));
    send({ type: 'error', message: getScanFailureMessage(error, 'Failed to scan all drives') });
  } finally {
    unregisterScan(control.id);
    res.end();
  }
}

// POST /api/cloud/scans/:scanId/:action  (pause | resume | cancel)
export function controlScanHandler(req: Request, res: Response) {
  const control = getScanControl(String(req.params['scanId']), req.user!.id);
  if (!control) {
    res.status(404).json({ error: 'Scan not found or already finished.' });
    return;
  }

  const action = String(req.params['action']);
  if (action === 'pause') control.pause();
  else if (action === 'resume') control.resume();
  else if (action === 'cancel') control.cancel();
  else {
    res.status(400).json({ error: 'Unknown action.' });
    return;
  }
  res.json({ success: true });
}