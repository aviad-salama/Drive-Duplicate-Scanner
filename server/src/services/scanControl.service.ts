import { randomUUID } from 'node:crypto';

export class ScanCancelledError extends Error {
  constructor() {
    super('Scan cancelled');
    this.name = 'ScanCancelledError';
  }
}

// Holds the pause/cancel state of one running scan; callers must checkpoint between work units.
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
    if (!this.cancelled) {
      this.paused = true;
    }
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

  // Blocks while paused and throws on cancellation, allowing long scans to stop cooperatively.
  async checkpoint() {
    while (this.paused && !this.cancelled) {
      await new Promise<void>((resolve) => this.waiters.push(resolve));
    }
    if (this.cancelled) {
      throw new ScanCancelledError();
    }
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

// Return a control handle only to the user who owns the scan.
export function getScanControl(id: string, userId: string): ScanControl | undefined {
  const control = activeScans.get(id);
  return control && control.userId === userId ? control : undefined;
}