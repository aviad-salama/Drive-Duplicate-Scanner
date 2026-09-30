import express from 'express';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = 3000;

// חובה לאפשר credentials כדי שהדפדפן יסכים לשלוח את ה-Cookies
app.use(cors({
  origin: 'http://localhost:5173', // שים לב שזה הפורט של ה-React שלך
  credentials: true
}));

// הפעלת קריאת עוגיות
app.use(cookieParser());

// פונקציה שמייצרת מופע חדש של OAuth לכל משתמש/בקשה (ללא שמירת טוקנים גלובלית!)
const getOauth2Client = () => new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
);

// ניתוב להתחלת ההתחברות
app.get('/auth/google', (req, res) => {
  const oauth2Client = getOauth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive'],
  });
  res.redirect(url);
});

// ניתוב החזרה מגוגל
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const oauth2Client = getOauth2Client();
    const { tokens } = await oauth2Client.getToken(code as string);
    
    // במקום לשמור לקובץ tokens.json, אנחנו שומרים את הטוקנים בעוגייה (Cookie) אצל המשתמש!
    res.cookie('drive_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // חובה להיות true כש-sameSite הוא none
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // קריטי לדומיינים שונים
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    
    // מפנים את המשתמש חזרה לאפליקציית הריאקט
    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
  } catch (error) {
    console.error('Error retrieving access token:', error);
    res.status(500).send('Authentication failed');
  }
});

// Middleware - שומר הסף שמוודא שהמשתמש מחובר
const requireDriveAuth = (req: any, res: any, next: any) => {
  const tokensCookie = req.cookies.drive_tokens;
  
  if (!tokensCookie) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }

  try {
    const tokens = JSON.parse(tokensCookie);
    const oauth2Client = getOauth2Client();
    oauth2Client.setCredentials(tokens);
    
    // מצמידים את האובייקט המאומת לבקשה כדי שהראוטרים הבאים יוכלו להשתמש בו
    req.driveClient = oauth2Client;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid authentication tokens' });
  }
};


// 1. Scan route - מוגן כעת על ידי ה-Middleware
app.get('/api/drive/scan', requireDriveAuth, async (req: any, res: any) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  try {
    // משתמשים באובייקט הייחודי של המשתמש שהגיע מה-Middleware!
    const drive = google.drive({ version: 'v3', auth: req.driveClient });
    
    let allFiles: any[] = [];
    let pageToken: string | undefined = undefined;
    let scannedCount = 0;
    const groups: Record<string, any[]> = {};

    do {
      const requestParams: any = {
        q: "'me' in owners and trashed = false",
        fields: 'nextPageToken, files(id, name, mimeType, size, md5Checksum, webViewLink, thumbnailLink)',
        pageSize: 250,
      };

      if (pageToken) requestParams.pageToken = pageToken;

      const response = await drive.files.list(requestParams);

      if (response.data.files && response.data.files.length > 0) {
        const currentFiles = response.data.files;
        allFiles = allFiles.concat(currentFiles);
        scannedCount += currentFiles.length;

        currentFiles.forEach(file => {
          if (file.md5Checksum) {
            if (!groups[file.md5Checksum]) groups[file.md5Checksum] = [];
            groups[file.md5Checksum]!.push(file);
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

    res.write(`data: ${JSON.stringify({ type: 'complete', totalScanned: allFiles.length, duplicateGroups })}\n\n`);
    res.end();
    
  } catch (error) {
    console.error('Error scanning drive:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to scan drive' })}\n\n`);
    res.end();
  }
});

// API endpoint to delete a file - מוגן
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

// 2. Stream route - מוגן
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

// Preview / thumbnail של כל סוגי הקבצים
app.get('/api/drive/thumbnail/:id', requireDriveAuth, async (req: any, res: any) => {
  try {
    const drive = google.drive({
      version: 'v3',
      auth: req.driveClient
    });

    // מקבלים את ה-thumbnailLink של הקובץ
    const metadata = await drive.files.get({
      fileId: req.params.id,
      fields: 'thumbnailLink,mimeType'
    });

    const thumbnailLink = metadata.data.thumbnailLink;

    if (!thumbnailLink) {
      return res.status(404).send('Thumbnail not available');
    }

    // מקבלים access token תקף
    const accessToken = await req.driveClient.getAccessToken();

    if (!accessToken.token) {
      return res.status(401).send('Unable to authenticate with Google Drive');
    }

    // מורידים את ה-thumbnail דרך Google עם Authorization
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