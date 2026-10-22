export interface CloudFile {
  id: string;
  name: string;
  mimeType: string;
  size: string | null;
  nativeHashes: Record<string, string>;
  webViewLink: string | null;
  thumbnailLink: string | null;
  path: string | null;
  accountId?: string;
  accountEmail?: string;
  provider?: string;
}

export interface DuplicateGroup {
  type: 'exact' | 'quality';
  files: CloudFile[];
}

export interface CloudAccount {
  id: string;
  provider: string;
  accountEmail: string;
  createdAt: string;
}
