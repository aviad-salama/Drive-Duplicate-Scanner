import type { Readable } from 'node:stream';
import { env } from '../../config/env.js';
import { AppError, CloudAuthorizationError } from '../../utils/errors.js';
import { withRetry } from '../../utils/retry.js';
import type { CloudFile, CloudProvider, ConnectedAccountInfo } from '../types.js';

const SCOPES = ['offline_access', 'Files.ReadWrite', 'User.Read'];

interface MicrosoftTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  error?: string;
  error_description?: string;
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
  parentReference?: {
    path?: string;
  };
}

async function getAccessToken(refreshToken: string): Promise<string> {
  const body = new URLSearchParams({
    client_id: env.ONEDRIVE_CLIENT_ID,
    client_secret: env.ONEDRIVE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: SCOPES.join(' '),
  });

  const res = await fetch(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    },
  );

  const data = (await res.json().catch(() => ({}))) as Partial<MicrosoftTokenResponse>;

  if (!res.ok) {
    if (data.error === 'invalid_grant' || res.status === 401) {
      throw new CloudAuthorizationError('onedrive');
    }

    let status = 400;
    if (res.status >= 500) {
      status = 502;
    }
    throw new AppError(status, `Microsoft token refresh failed (HTTP ${res.status}).`);
  }

  if (!data.access_token) {
    throw new AppError(502, 'Microsoft token refresh returned no access token.');
  }

  return data.access_token;
}

const toCloudFile = (item: GraphDriveItem): CloudFile => {
  const nativeHashes: Record<string, string> = {};

  if (item.file?.hashes?.quickXorHash) {
    nativeHashes.quickxor = item.file.hashes.quickXorHash;
  }

  if (item.file?.hashes?.sha1Hash) {
    nativeHashes.sha1 = item.file.hashes.sha1Hash;
  }

  const parentPath = item.parentReference?.path
    ?.replace(/^\/drive\/root:/, '')
    .replace(/\/+$/, '') ?? '';

  const path = `${parentPath}/${item.name}`.replace(/\/+/g, '/');

  return {
    id: item.id,
    name: item.name,
    mimeType: item.file?.mimeType ?? 'application/octet-stream',
    size: item.size !== undefined ? String(item.size) : null,
    nativeHashes,
    webViewLink: item.webUrl ?? null,
    thumbnailLink:
      item.thumbnails?.[0]?.large?.url ??
      item.thumbnails?.[0]?.medium?.url ??
      null,
    path: path.startsWith('/') ? path : `/${path}`,
  };
};

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

    const tokenRes = await fetch(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      },
    );

    if (!tokenRes.ok) {
      throw new AppError(400, 'Microsoft token exchange failed.');
    }

    const tokens = (await tokenRes.json()) as MicrosoftTokenResponse;

    if (!tokens.refresh_token) {
      throw new AppError(400, 'Microsoft did not return a refresh token.');
    }

    const userRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      throw new AppError(400, 'Failed to fetch Microsoft profile info.');
    }

    const userData = (await userRes.json()) as {
      id: string;
      userPrincipalName?: string;
      mail?: string;
    };

    const email = userData.mail || userData.userPrincipalName;

    if (!email) {
      throw new AppError(400, 'Could not determine Microsoft email.');
    }

    return {
      providerAccountId: userData.id,
      accountEmail: email,
      refreshToken: tokens.refresh_token,
    };
  },

  async* listFiles(refreshToken: string) {
    const accessToken = await getAccessToken(refreshToken);

    let nextLink: string | null =
      'https://graph.microsoft.com/v1.0/me/drive/root/delta?$select=id,name,size,webUrl,file,thumbnails,parentReference';

    do {
      const url = nextLink;

      const res = await withRetry(async () => {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          throw new AppError(
            response.status,
            `OneDrive API returned HTTP ${response.status}.`,
          );
        }

        return response;
      });

      const data = (await res.json()) as {
        value?: GraphDriveItem[];
        '@odata.nextLink'?: string;
      };

      const files = (data.value ?? [])
        .filter((item) => Boolean(item.file && item.file.hashes && !('@removed' in item)))
        .map(toCloudFile);

      if (files.length > 0) {
        yield files;
      }

      nextLink = data['@odata.nextLink'] ?? null;
    } while (nextLink);
  },

  async deleteFile(refreshToken: string, fileId: string): Promise<void> {
    const accessToken = await getAccessToken(refreshToken);

    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!res.ok && res.status !== 404) {
      throw new AppError(res.status, 'Failed to delete file from OneDrive.');
    }
  },

  async streamFile(refreshToken: string, fileId: string, range?: string) {
    const accessToken = await getAccessToken(refreshToken);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };

    if (range) {
      headers.Range = range;
    }

    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
      { headers },
    );

    if (!res.ok && res.status !== 206) {
      throw new AppError(res.status, 'Failed to stream OneDrive file.');
    }

    const responseHeaders: Record<string, string> = {};

    for (const header of ['content-type', 'content-length', 'content-range']) {
      const value = res.headers.get(header);

      if (value) {
        responseHeaders[header] = value;
      }
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

    if (!res.ok) {
      return null;
    }

    return {
      contentType: res.headers.get('content-type') ?? 'image/jpeg',
      buffer: Buffer.from(await res.arrayBuffer()),
    };
  },
};
