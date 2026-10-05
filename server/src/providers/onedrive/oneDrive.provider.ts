import type { Readable } from 'node:stream';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';
import { withRetry } from '../../utils/retry.js';
import type { CloudFile, CloudProvider, ConnectedAccountInfo } from '../types.js';

const SCOPES = ['offline_access', 'Files.ReadWrite', 'User.Read'];

interface MicrosoftTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface GraphDriveItem {
  id: string;
  name: string;
  size?: number;
  webUrl?: string;
  file?: {
    mimeType?: string;
    hashes?: {
      quickXorHash?: string;
      sha1Hash?: string;
    };
  };
  thumbnails?: Array<{
    large?: { url?: string };
    medium?: { url?: string };
  }>;
}

async function getAccessToken(refreshToken: string): Promise<string> {
  const body = new URLSearchParams({
    client_id: env.ONEDRIVE_CLIENT_ID,
    client_secret: env.ONEDRIVE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: SCOPES.join(' '),
  });

  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new AppError(401, 'Failed to refresh Microsoft access token');
  }

  const data = (await res.json()) as MicrosoftTokenResponse;
  return data.access_token;
}

const toCloudFile = (item: GraphDriveItem): CloudFile => ({
  id: item.id,
  name: item.name,
  mimeType: item.file?.mimeType ?? 'application/octet-stream',
  size: item.size !== undefined ? String(item.size) : null,
  checksum: item.file?.hashes?.quickXorHash ?? item.file?.hashes?.sha1Hash ?? null,
  webViewLink: item.webUrl ?? null,
  thumbnailLink: item.thumbnails?.[0]?.large?.url ?? item.thumbnails?.[0]?.medium?.url ?? null,
});

export const oneDriveProvider: CloudProvider = {
  id: 'onedrive',

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: env.ONEDRIVE_CLIENT_ID,
      response_type: 'code',
      redirect_uri: env.ONEDRIVE_REDIRECT_URI,
      response_mode: 'query',
      scope: SCOPES.join(' '),
      state,
      prompt: 'select_account',
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  },

  async exchangeCode(code: string): Promise<ConnectedAccountInfo> {
    const body = new URLSearchParams({
      client_id: env.ONEDRIVE_CLIENT_ID,
      client_secret: env.ONEDRIVE_CLIENT_SECRET,
      code,
      redirect_uri: env.ONEDRIVE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!tokenRes.ok) {
      throw new AppError(400, 'Microsoft token exchange failed');
    }

    const tokens = (await tokenRes.json()) as MicrosoftTokenResponse;
    if (!tokens.refresh_token) {
      throw new AppError(400, 'Microsoft did not return a refresh token');
    }

    const userRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      throw new AppError(400, 'Failed to fetch Microsoft profile info');
    }

    const userData = (await userRes.json()) as { id: string; userPrincipalName?: string; mail?: string };
    const email = userData.mail || userData.userPrincipalName;
    if (!email) throw new AppError(400, 'Could not determine Microsoft email');

    return {
      providerAccountId: userData.id,
      accountEmail: email,
      refreshToken: tokens.refresh_token,
    };
  },

  async *listFiles(refreshToken: string) {
    const accessToken = await getAccessToken(refreshToken);
    let nextLink: string | null =
      'https://graph.microsoft.com/v1.0/me/drive/root/delta?$select=id,name,size,webUrl,file,thumbnails';

    do {
      const url = nextLink;
      const res = await withRetry(async () => {
        const r = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!r.ok) throw new Error(`OneDrive API returned ${r.status}`);
        return r;
      });

      const data = (await res.json()) as {
        value?: GraphDriveItem[];
        '@odata.nextLink'?: string;
      };

      // Filter only files (items with a file facet and checksum, skipping folders or deleted items)
      const files = (data.value ?? [])
        .filter((item) => Boolean(item.file && item.file.hashes && !('@removed' in item)))
        .map(toCloudFile);

      if (files.length > 0) yield files;
      nextLink = data['@odata.nextLink'] ?? null;
    } while (nextLink);
  },

  async deleteFile(refreshToken: string, fileId: string): Promise<void> {
    const accessToken = await getAccessToken(refreshToken);
    const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok && res.status !== 404) {
      throw new AppError(res.status, 'Failed to delete file from OneDrive');
    }
  },

  async streamFile(refreshToken: string, fileId: string, range?: string) {
    const accessToken = await getAccessToken(refreshToken);
    const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` };
    if (range) headers['Range'] = range;

    const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`, {
      headers,
    });

    if (!res.ok && res.status !== 206) {
      throw new AppError(res.status, 'Failed to stream OneDrive file');
    }

    const responseHeaders: Record<string, string> = {};
    for (const h of ['content-type', 'content-length', 'content-range']) {
      const v = res.headers.get(h);
      if (v) responseHeaders[h] = v;
    }

    return {
      status: res.status,
      headers: responseHeaders,
      stream: res.body as unknown as Readable,
    };
  },

  async getThumbnail(refreshToken: string, fileId: string) {
    const accessToken = await getAccessToken(refreshToken);
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/thumbnails/0/large/content`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!res.ok) return null;

    return {
      contentType: res.headers.get('content-type') ?? 'image/jpeg',
      buffer: Buffer.from(await res.arrayBuffer()),
    };
  },
};