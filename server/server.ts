import express from 'express';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = 3000;

// Enable credentials for Cookies
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Enable cookie parser
app.use(cookieParser());

// Create a new OAuth2 client per request
const getOauth2Client = () => new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
);

// Login route
app.get('/auth/google', (req, res) => {
  const oauth2Client = getOauth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive'],
  });
  res.redirect(url);
});

// Google callback route
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const oauth2Client = getOauth2Client();
    const { tokens } = await oauth2Client.getToken(code as string);
    
    // Store tokens in a secure cookie
    res.cookie('drive_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    
    // Redirect back to client
    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
  } catch (error) {
    console.error('Error retrieving access token:', error);
    res.status(500).send('Authentication failed');
  }
});

// Auth middleware
const requireDriveAuth = (req: any, res: any, next: any) => {
  const tokensCookie = req.cookies.drive_tokens;
  
  if (!tokensCookie) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }

  try {
    const tokens = JSON.parse(tokensCookie);
    const oauth2Client = getOauth2Client();
    oauth2Client.setCredentials(tokens);
    
    // Attach the oauth2Client to the request object for later use in routes
    req.driveClient = oauth2Client;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid authentication tokens' });
  }
};


// 1. Scan route for finding duplicates
app.get('/api/drive/scan', requireDriveAuth, async (req: any, res: any) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  try {
    // Get the authenticated Google Drive client
    const drive = google.drive({ version: 'v3', auth: req.driveClient });
    
    let pageToken: string | undefined = undefined;
    let scannedCount = 0;
    const groups: Record<string, any[]> = {};

    do {
      const requestParams: any = {
        q: "'me' in owners and trashed = false and mimeType != 'application/vnd.google-apps.folder' and not mimeType contains 'application/vnd.google-apps'",
        fields: 'nextPageToken, files(id, name, mimeType, size, md5Checksum, webViewLink, thumbnailLink)',
        pageSize: 250,
      };

      if (pageToken) requestParams.pageToken = pageToken;

      // Implement retry logic for rate limiting and server errors, to prevent the server from crashing
      let response;
      let retries = 0;
      const maxRetries = 3;

      while (retries <= maxRetries) {
        try {
          response = await drive.files.list(requestParams);
          break; 
        } catch (err: any) {
          if ((err.code === 429 || err.code >= 500) && retries < maxRetries) {
            retries++;
            const delay = Math.pow(2, retries) * 1000 + Math.floor(Math.random() * 1000);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            throw err;
          }
        }
      }

      if (!response) {
        throw new Error('Failed to fetch from Google Drive after maximum retries.');
      }

      if (response.data.files && response.data.files.length > 0) {
        const currentFiles = response.data.files;
        scannedCount += currentFiles.length;

        currentFiles.forEach(file => {
          if (file.md5Checksum) {
            if (!groups[file.md5Checksum]) groups[file.md5Checksum] = [];
            
            // Store lightweight object to prevent memory leaks
            groups[file.md5Checksum]!.push({
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              size: file.size,
              webViewLink: file.webViewLink,
              thumbnailLink: file.thumbnailLink
            });
          }
        });

        let currentDuplicates = 0;
        for (const key in groups) {
          if (groups[key]!.length > 1) currentDuplicates++;
        }

        res.write(`data: ${JSON.stringify({ type: 'progress', scannedCount, duplicatesCount: currentDuplicates })}\n\n`);
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    const duplicateGroups = Object.values(groups)
      .filter(group => group.length > 1)
      .map(group => {
        group.sort((a, b) => parseInt(b.size || '0') - parseInt(a.size || '0'));
        return { type: 'exact', files: group };
      });

    res.write(`data: ${JSON.stringify({ type: 'complete', totalScanned: scannedCount, duplicateGroups })}\n\n`);
    res.end();
    
  } catch (error) {
    console.error('Error scanning drive:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to scan drive' })}\n\n`);
    res.end();
  }
});

// API endpoint to delete a file
app.delete('/api/drive/file/:id', requireDriveAuth, async (req: any, res: any) => {
  try {
    const drive = google.drive({ version: 'v3', auth: req.driveClient });
    await drive.files.delete({ fileId: req.params.id });
    res.json({ success: true, message: `File deleted successfully` });
  } catch (error: any) {
    console.error('Failed to delete file:', error?.message);
    res.status(500).json({ success: false, message: 'Failed to delete file' });
  }
});

// 2. Stream route
app.get('/api/drive/file/:id', requireDriveAuth, async (req: any, res: any) => {
  try {
    const drive = google.drive({ version: 'v3', auth: req.driveClient });
    const range = req.headers.range;

    const response = await drive.files.get(
      { fileId: req.params.id, alt: 'media' },
      { responseType: 'stream', headers: range ? { Range: range } : {} }
    );

    res.status(response.status);
    for (const h of ['content-type', 'content-length', 'content-range']) {
      const v = response.headers[h];
      if (v) res.setHeader(h, v as string);
    }
    res.setHeader('Accept-Ranges', 'bytes');

    req.on('close', () => response.data.destroy());

    response.data
      .on('error', (err: Error) => {
        if (!res.headersSent) res.status(500).send('Error streaming file');
        else res.end();
      })
      .pipe(res);
  } catch (error: any) {
    if (!res.headersSent) res.status(error?.response?.status || 500).send('Failed to fetch file');
  }
});

// Thumbnail proxy route
app.get('/api/drive/thumbnail/:id', requireDriveAuth, async (req: any, res: any) => {
  try {
    const drive = google.drive({
      version: 'v3',
      auth: req.driveClient
    });

    // Get the thumbnailLink
    const metadata = await drive.files.get({
      fileId: req.params.id,
      fields: 'thumbnailLink,mimeType'
    });

    const thumbnailLink = metadata.data.thumbnailLink;

    if (!thumbnailLink) {
      return res.status(404).send('Thumbnail not available');
    }

    // Get valid access token
    const accessToken = await req.driveClient.getAccessToken();

    if (!accessToken.token) {
      return res.status(401).send('Unable to authenticate with Google Drive');
    }

    // Fetch thumbnail with Authorization header
    const thumbnailResponse = await fetch(thumbnailLink, {
      headers: {
        Authorization: `Bearer ${accessToken.token}`
      }
    });

    if (!thumbnailResponse.ok) {
      return res.status(thumbnailResponse.status).send('Failed to fetch thumbnail');
    }

    const contentType =
      thumbnailResponse.headers.get('content-type') || 'image/jpeg';

    const buffer = Buffer.from(await thumbnailResponse.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    res.send(buffer);

  } catch (error: any) {
    console.error('Failed to fetch thumbnail:', error?.message);
    res.status(error?.response?.status || 500).send('Failed to fetch thumbnail');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});