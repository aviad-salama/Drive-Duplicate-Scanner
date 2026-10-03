export interface CloudFile {
  id: string;
  name: string;
  mimeType: string;
  size: string | null;
  checksum: string | null;
  webViewLink: string | null;
  thumbnailLink: string | null;
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