import { randomUUID } from 'node:crypto';

export class ScanCancelledError extends Error {
  constructor() {
    super('Scan cancelled');
    this.name = 'ScanCancelledError';
  }
}

// Holds the pause/cancel state of one running scan.
export class ScanControl {
  readonly id: string = randomUUID();
  readonly userId: string;
  private paused = false;
  private cancelled = false;
  private waiters: Array<() => void> = [];

  constructor(userId: string) {
    this.userId = userId;
  }

  pause() {
    if (!this.cancelled) this.paused = true;
  }

  resume() {
    this.paused = false;
    this.flush();
  }

  cancel() {
    this.cancelled = true;
    this.paused = false;
    this.flush();
  }

  // Call between units of work: blocks while paused, throws if cancelled.
  async checkpoint() {
    while (this.paused && !this.cancelled) {
      await new Promise<void>((resolve) => this.waiters.push(resolve));
    }
    if (this.cancelled) throw new ScanCancelledError();
  }

  private flush() {
    const pending = this.waiters;
    this.waiters = [];
    pending.forEach((resolve) => resolve());
  }
}

const activeScans = new Map<string, ScanControl>();

export function registerScan(userId: string): ScanControl {
  const control = new ScanControl(userId);
  activeScans.set(control.id, control);
  return control;
}

export function unregisterScan(id: string) {
  activeScans.delete(id);
}

// Only the owner of the scan can control it.
export function getScanControl(id: string, userId: string): ScanControl | undefined {
  const control = activeScans.get(id);
  return control && control.userId === userId ? control : undefined;
}