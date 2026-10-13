import type { Request, Response } from 'express';

function getCloudContext(req: Request, res: Response) {
  if (!req.cloud) {
    res.status(500).json({ error: 'Cloud account context is unavailable.' });
    return null;
  }

  return req.cloud;
}

export async function deleteFileHandler(req: Request, res: Response) {
  const cloud = getCloudContext(req, res);
  if (!cloud) {
    return;
  }

  const { provider, refreshToken } = cloud;
  await provider.deleteFile(refreshToken, String(req.params['fileId']));
  res.json({ success: true });
}

export async function streamFileHandler(req: Request, res: Response) {
  const cloud = getCloudContext(req, res);
  if (!cloud) {
    return;
  }

  const { provider, refreshToken } = cloud;
  const { status, headers, stream } = await provider.streamFile(
    refreshToken,
    String(req.params['fileId']),
    req.headers.range,
  );

  res.status(status);
  for (const name of ['content-type', 'content-length', 'content-range']) {
    const value = headers[name];
    if (value) {
      res.setHeader(name, value);
    }
  }
  res.setHeader('Accept-Ranges', 'bytes');

  req.on('close', () => stream.destroy());
  stream
    .on('error', () => {
      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.end();
      }
    })
    .pipe(res);
}

export async function thumbnailHandler(req: Request, res: Response) {
  const cloud = getCloudContext(req, res);
  if (!cloud) {
    return;
  }

  const { provider, refreshToken } = cloud;
  try {
    const thumb = await provider.getThumbnail(refreshToken, String(req.params['fileId']));
    if (thumb) {
      res.setHeader('Content-Type', thumb.contentType);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.send(thumb.buffer);
      return;
    }
  } catch (error) {
    console.warn('Thumbnail fetch failed:', error);
  }
  // 204 instead of 404: the browser logs no console error for it,
  // and the <img> onError handler on the client shows a placeholder.
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.status(204).end();
}