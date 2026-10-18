import type { Readable } from 'node:stream';
import { google, type drive_v3 } from 'googleapis';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';
import { withRetry } from '../../utils/retry.js';
import type { CloudFile, CloudProvider } from '../types.js';

const SCOPES = ['openid', 'email', 'https://www.googleapis.com/auth/drive'];

const newOAuthClient = () =>
  new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI);

// googleapis refreshes the access token automatically from the refresh token
function authedDrive(refreshToken: string) {
  const client = newOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return { client, drive: google.drive({ version: 'v3', auth: client }) };
}

const toCloudFile = (f: drive_v3.Schema$File, path: string): CloudFile => ({
  id: f.id ?? '',
  name: f.name ?? '',
  mimeType: f.mimeType ?? '',
  size: f.size ?? null,
  nativeHashes: f.md5Checksum ? { md5: f.md5Checksum } : {},
  webViewLink: f.webViewLink ?? null,
  thumbnailLink: f.thumbnailLink ?? null,
  path,
});

export const googleDriveProvider: CloudProvider = {
  id: 'google-drive',

  getAuthUrl(state) {
    return newOAuthClient().generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES,
      state,
    });
  },

  async exchangeCode(code) {
    const client = newOAuthClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token || !tokens.id_token) {
      throw new AppError(400, 'Google did not return the required tokens');
    }
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new AppError(400, 'Invalid Google identity');
    }
    return {
      providerAccountId: payload.sub,
      accountEmail: payload.email,
      refreshToken: tokens.refresh_token,
    };
  },

  async* listFiles(refreshToken) {
    const { drive } = authedDrive(refreshToken);

    const folders = new Map<
    string,
    { name: string; parents: string[] }
    >();

    let folderPageToken: string | undefined;

    do {
      const currentFolderToken = folderPageToken;
      const response = await withRetry(() =>
        drive.files.list({
          q: "'me' in owners and trashed = false and mimeType = 'application/vnd.google-apps.folder'",
          fields: 'nextPageToken, files(id, name, parents)',
          pageSize: 1000,
          ...(currentFolderToken ? { pageToken: currentFolderToken } : {}),
        }),
      );

      for (const folder of response.data.files ?? []) {
        if (!folder.id) {
          continue;
        }

        folders.set(folder.id, {
          name: folder.name ?? '',
          parents: folder.parents ?? [],
        });
      }

      folderPageToken = response.data.nextPageToken ?? undefined;
    } while (folderPageToken);

    const buildPath = (file: drive_v3.Schema$File): string => {
      const parts = [file.name ?? ''];
      let parentId = file.parents?.[0];
      const visited = new Set<string>();

      while (parentId && !visited.has(parentId)) {
        visited.add(parentId);

        const parent = folders.get(parentId);
        if (!parent) {
          break;
        }

        if (parent.name) {
          parts.unshift(parent.name);
        }

        [parentId] = parent.parents;
      }

      return `/${parts.filter(Boolean).join('/')}`;
    };

    let pageToken: string | undefined;

    do {
      const params: drive_v3.Params$Resource$Files$List = {
        q: "'me' in owners and trashed = false and mimeType != 'application/vnd.google-apps.folder' and not mimeType contains 'application/vnd.google-apps'",
        fields: 'nextPageToken, files(id, name, mimeType, size, md5Checksum, webViewLink, thumbnailLink, parents)',
        pageSize: 250,
        ...(pageToken ? { pageToken } : {}),
      };

      const response = await withRetry(() => drive.files.list(params));

      const files = (response.data.files ?? []).map((file) =>
        toCloudFile(file, buildPath(file)),
      );

      if (files.length > 0) {
        yield files;
      }

      pageToken = response.data.nextPageToken ?? undefined;
    } while (pageToken);
  },

  async deleteFile(refreshToken, fileId) {
    const { drive } = authedDrive(refreshToken);
    // Move to trash (recoverable) instead of permanent delete
    await drive.files.update({ fileId, requestBody: { trashed: true } });
  },

  async streamFile(refreshToken, fileId, range) {
    const { drive } = authedDrive(refreshToken);
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream', headers: range ? { Range: range } : {} },
    );
    return {
      status: response.status,
      headers: response.headers as Record<string, string>,
      stream: response.data as unknown as Readable,
    };
  },

  async getThumbnail(refreshToken, fileId) {
    const { client, drive } = authedDrive(refreshToken);
    const meta = await drive.files.get({ fileId, fields: 'thumbnailLink' });
    const link = meta.data.thumbnailLink;
    if (!link) {
      return null;
    }

    const { token } = await client.getAccessToken();
    if (!token) {
      return null;
    }

    const response = await fetch(link, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      return null;
    }

    return {
      contentType: response.headers.get('content-type') ?? 'image/jpeg',
      buffer: Buffer.from(await response.arrayBuffer()),
    };
  },
};
