import type { Readable } from 'node:stream';

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

export interface ConnectedAccountInfo {
  providerAccountId: string;
  accountEmail: string;
  refreshToken: string;
}

/** Adapter contract implemented by each cloud storage provider. */
export interface CloudProvider {
  id: string;
  getAuthUrl(state: string): string;
  exchangeCode(code: string): Promise<ConnectedAccountInfo>;
  // Yields paginated results so scans can report progress while listing large accounts.
  listFiles(refreshToken: string): AsyncGenerator<CloudFile[]>;
  deleteFile(refreshToken: string, fileId: string): Promise<void>;
  // Streams file contents for fingerprinting or ranged media responses; avoid buffering large files.
  streamFile(
    refreshToken: string,
    fileId: string,
    range?: string,
  ): Promise<{ status: number; headers: Record<string, string>; stream: Readable }>;
  getThumbnail(
    refreshToken: string,
    fileId: string,
  ): Promise<{ contentType: string; buffer: Buffer } | null>;
}
