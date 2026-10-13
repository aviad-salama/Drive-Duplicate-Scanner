
export const ProviderId = {
  GOOGLE_DRIVE: 'google-drive',
  ONEDRIVE: 'onedrive',
} as const;

export const PROVIDERS = [
  { id: ProviderId.GOOGLE_DRIVE, label: 'Google Drive' },
  { id: ProviderId.ONEDRIVE, label: 'OneDrive' },
] as const;

export const providerLabel = (id: string) => PROVIDERS.find((p) => p.id === id)?.label ?? id;