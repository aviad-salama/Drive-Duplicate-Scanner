import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { getCloudAccountForUser } from '../services/cloudAccount.service.js';
import { createScan, finishScan, runMultiAccountScan } from '../services/scan.service.js';
import { getScanControl, registerScan, unregisterScan } from '../services/scanControl.service.js';
import { ScanAction, ScanEventType, ScanStatus } from '../types/scan.js';
import { CloudAuthorizationError } from '../utils/errors.js';

const scanErrorSchema = z.object({
  name: z.string().optional(),
  message: z.string().optional(),
  code: z.union([z.string(), z.number()]).optional(),
  status: z.number().optional(),
  response: z.object({
    data: z.object({
      error: z.string().optional(),
      error_description: z.string().optional(),
    }).optional(),
  }).optional(),
});

function getSafeScanError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return { name: 'UnknownError' };
  }

  const result = scanErrorSchema.safeParse(error);

  const details = result.success ? result.data : {};

  return {
    name: details.name ?? 'UnknownError',
    message: details.message,
    code: details.code,
    status: details.status,
    providerError: details.response?.data?.error_description
      ?? details.response?.data?.error,
  };
}

function getScanFailureMessage(error: unknown, fallback: string) {
  const details = getSafeScanError(error);
  if (details.providerError === 'invalid_grant') {
    return 'Cloud authorization expired or was revoked. Disconnect and reconnect this account.';
  }
  return details.providerError || details.message || fallback;
}

function sendScanFailure(send: (data: unknown) => void, error: unknown, fallback: string): void {
  if (error instanceof CloudAuthorizationError) {
    send({
      type: ScanEventType.Error,
      code: error.code,
      message: error.message,
      accountId: error.accountId,
      accountEmail: error.accountEmail,
      provider: error.provider,
    });
    return;
  }

  send({
    type: ScanEventType.Error,
    message: getScanFailureMessage(error, fallback),
  });
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
  if (!req.cloud) {
    res.status(500).json({ error: 'Cloud account context is unavailable.' });
    return;
  }

  const account = await getCloudAccountForUser(req.cloud.accountId, userId);
  if (!account) {
    res.status(404).json({ error: 'Cloud account not found.' });
    return;
  }

  const send = openEventStream(res);
  const control = registerScan(userId);
  // Stop the work if the browser disconnects (closed tab, reset, etc.).
  res.on('close', () => control.cancel());
  res.on('error', (error) => sendScanFailure(send, error, 'Failed to scan drive'));

  const scan = await createScan(userId, account.id);
  try {
    const result = await runMultiAccountScan(
      [account],
      (p) => send({ type: ScanEventType.Progress, ...p }),
      control,
    );
    // A cancelled scan is stored as COMPLETED with its partial counts.
    await finishScan(scan.id, ScanStatus.COMPLETED, result.totalScanned, result.duplicateGroups.length);
    send({ type: result.cancelled ? ScanEventType.Cancelled : ScanEventType.Complete, ...result });
  } catch (error) {
    console.error('Scan failed:', getSafeScanError(error));
    await finishScan(scan.id, ScanStatus.FAILED);
    send({ type: ScanEventType.Error, message: getScanFailureMessage(error, 'Failed to scan drive') });
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
  send({ type: ScanEventType.Started, scanId: control.id });

  try {
    const accounts = await prisma.cloudAccount.findMany({ where: { userId } });
    if (accounts.length === 0) {
      send({ type: ScanEventType.Error, message: 'No connected accounts found' });
      return;
    }

    const result = await runMultiAccountScan(
      accounts,
      (p) => send({ type: ScanEventType.Progress, ...p }),
      control,
    );
    send({ type: result.cancelled ? ScanEventType.Cancelled : ScanEventType.Complete, ...result });
  } catch (error) {
    console.error('Scan all failed:', getSafeScanError(error));
    send({ type: ScanEventType.Error, message: getScanFailureMessage(error, 'Failed to scan all drives') });
  } finally {
    unregisterScan(control.id);
    res.end();
  }
}

// POST /api/cloud/scans/:scanId/:action  (pause | resume | cancel)
export function controlScanHandler(req: Request, res: Response) {
  const control = getScanControl(String(req.params.scanId), req.user!.id);
  if (!control) {
    res.status(404).json({ error: 'Scan not found or already finished.' });
    return;
  }

  const action = String(req.params.action);
  if (action === ScanAction.Pause) {
    control.pause();
  } else if (action === ScanAction.Resume) {
    control.resume();
  } else if (action === ScanAction.Cancel) {
    control.cancel();
  } else {
    res.status(400).json({ error: 'Unknown action.' });
    return;
  }
  res.json({ success: true });
}
