import type { Readable } from 'node:stream';

export interface CloudFile {
  id: string;
  name: string;
  mimeType: string;
  size: string | null;
  checksum: string | null; // Hash returned by the cloud provider; compare only within the same provider.
  webViewLink: string | null;
  thumbnailLink: string | null;
}

export interface ConnectedAccountInfo {
  providerAccountId: string;
  accountEmail: string;
  refreshToken: string;
}

export interface CloudProvider {
  id: string;
  getAuthUrl(state: string): string;
  exchangeCode(code: string): Promise<ConnectedAccountInfo>;
  listFiles(refreshToken: string): AsyncGenerator<CloudFile[]>; // Each yield returns one page of files.
  deleteFile(refreshToken: string, fileId: string): Promise<void>;
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