import { AppError } from '../utils/errors.js';
import { googleDriveProvider } from './google-drive/googleDrive.provider.js';
import { oneDriveProvider } from './onedrive/oneDrive.provider.js';
import type { CloudProvider } from './types.js';

const providers: Record<string, CloudProvider> = {
  [googleDriveProvider.id]: googleDriveProvider,
  [oneDriveProvider.id]: oneDriveProvider,
  // Add Dropbox, OneDrive, and other providers here, one entry per provider.
};

export function getProvider(id: string): CloudProvider {
  const provider = providers[id];
  if (!provider) {
    throw new AppError(404, `Unknown provider: ${id}`);
  }
  return provider;
}
