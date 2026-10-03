export const PROVIDERS = [{ id: 'google-drive', label: 'Google Drive' }] as const;

export const providerLabel = (id: string) => PROVIDERS.find((p) => p.id === id)?.label ?? id;