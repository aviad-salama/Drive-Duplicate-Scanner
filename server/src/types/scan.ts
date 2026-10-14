export enum ScanStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum ScanAction {
  Pause = 'pause',
  Resume = 'resume',
  Cancel = 'cancel',
}

export enum ScanEventType {
  Started = 'started',
  Progress = 'progress',
  Complete = 'complete',
  Cancelled = 'cancelled',
  Error = 'error',
}
