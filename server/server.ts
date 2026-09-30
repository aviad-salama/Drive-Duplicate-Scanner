import  express from 'express';
import  { google } from 'googleapis';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
dotenv.config();

const app = express();
app.use(cors());
const PORT = 3000;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/auth/google/callback'
);

// Check if already authenticated previously and saved tokens exist
if (fs.existsSync('tokens.json')) {
  const tokenData = fs.readFileSync('tokens.json', 'utf8');
  oauth2Client.setCredentials(JSON.parse(tokenData));
  console.log('✅ Tokens loaded securely from tokens.json. You bypass the login screen!');
}

// api endpoint to initiate Google OAuth2 flow
app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive'],
  });
  res.redirect(url);
});

// api endpoint to receive the OAuth2 callback and exchange the authorization code for access tokens
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code as string);
    
    oauth2Client.setCredentials(tokens);
    
    // Save tokens to file for persistent authentication
    fs.writeFileSync('tokens.json', JSON.stringify(tokens));
    
    res.send('<h1>Successfully authenticated!</h1><p>You can now scan Drive.</p>');
  } catch (error) {
    console.error('Error retrieving access token:', error);
    res.status(500).send('Authentication failed');
  }
});

// API endpoint for scanning the Drive and identifying duplicates
// 1. Scan route - identifies duplicates and returns only duplicate groups
app.get('/api/drive/scan', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    let allFiles: any[] = [];
    let pageToken: string | undefined = undefined;
    let scannedCount = 0;
    
    // Moved outside the loop to track duplicates in real-time
    const groups: Record<string, any[]> = {};

    do {
      const requestParams: any = {
        q: "'me' in owners and trashed = false",
        fields: 'nextPageToken, files(id, name, mimeType, size, md5Checksum, webViewLink, thumbnailLink)',
        pageSize: 250, // Reduced for much more frequent live updates
      };

      if (pageToken) {
        requestParams.pageToken = pageToken;
      }

      const response = await drive.files.list(requestParams);

      if (response.data.files && response.data.files.length > 0) {
        const currentFiles = response.data.files;
        allFiles = allFiles.concat(currentFiles);
        scannedCount += currentFiles.length;

        // Process files into groups on the fly
        currentFiles.forEach(file => {
          if (file.md5Checksum) {
            if (!groups[file.md5Checksum]) {
              groups[file.md5Checksum] = [];
            }
            groups[file.md5Checksum]!.push(file);
          }
        });

        // Calculate the current number of duplicate sets
        let currentDuplicates = 0;
        for (const key in groups) {
          if (groups[key]!.length > 1) {
            currentDuplicates++;
          }
        }

        // Stream the live progress to the frontend
        res.write(`data: ${JSON.stringify({ type: 'progress', scannedCount, duplicatesCount: currentDuplicates })}\n\n`);
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    // Final sorting and filtering
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

// API endpoint to delete a file by its ID from Google Drive
app.delete('/api/drive/file/:id', async (req, res) => {
  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const fileId = req.params.id;

    // Call Google Drive API to delete the file
    await drive.files.delete({
      fileId: fileId,
    });

    res.json({ success: true, message: `File ${fileId} deleted successfully` });
  } catch (error: any) {
    console.error('Failed to delete file:', error?.message);
    res.status(500).json({ success: false, message: 'Failed to delete file' });
  }
});

// 2. Stream route: fetches the file from Google Drive and streams it directly to the client
app.get('/api/drive/file/:id', async (req, res) => {
  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const range = req.headers.range;

    const response = await drive.files.get(
      { fileId: req.params.id, alt: 'media' },
      {
        responseType: 'stream',
        headers: range ? { Range: range } : {},
      }
    );

    // Forward the status code (200/206) and relevant headers to the browser
    res.status(response.status);
    for (const h of ['content-type', 'content-length', 'content-range']) {
      const v = response.headers[h];
      if (v) res.setHeader(h, v as string);
    }
    res.setHeader('Accept-Ranges', 'bytes');

    // If the browser closes the connection (e.g. navigated away), stop downloading from Google
    req.on('close', () => response.data.destroy());

    response.data
      .on('error', (err: Error) => {
        console.error('Error streaming file:', err);
        if (!res.headersSent) res.status(500).send('Error streaming file');
        else res.end();
      })
      .pipe(res);
  } catch (error: any) {
    console.error('Failed to fetch file media:', error?.message);
    if (!res.headersSent) res.status(error?.response?.status || 500).send('Failed to fetch file');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});