import type { Request, Response } from 'express';
import { createScan, finishScan, runScan } from '../services/scan.service.js';

// SSE: Send progress updates in real time.
export async function scanHandler(req: Request, res: Response) {
  const { provider, refreshToken, accountId } = req.cloud!;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  const send = (data: unknown) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const scan = await createScan(req.user!.id, accountId);
  try {
    const result = await runScan(provider, refreshToken, (p) => send({ type: 'progress', ...p }));
    await finishScan(scan.id, 'COMPLETED', result.totalScanned, result.duplicateGroups.length);
    send({ type: 'complete', ...result });
  } catch (error) {
    console.error('Scan failed:', error);
    await finishScan(scan.id, 'FAILED');
    send({ type: 'error', message: 'Failed to scan drive' });
  } finally {
    res.end();
  }
}