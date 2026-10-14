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

export enum ScanMode {
  Single = 'single',
  All = 'all',
}
