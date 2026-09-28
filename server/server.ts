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

// בדיקה אם כבר התחברנו בעבר ויש לנו טוקנים שמורים
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
    scope: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  res.redirect(url);
});

// api endpoint to receive the OAuth2 callback and exchange the authorization code for access tokens
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code as string);
    
    oauth2Client.setCredentials(tokens);
    
    // שמירת הטוקנים בקובץ לUserController
    fs.writeFileSync('tokens.json', JSON.stringify(tokens));
    
    res.send('<h1>Successfully authenticated!</h1><p>You can now scan Drive.</p>');
  } catch (error) {
    console.error('Error retrieving access token:', error);
    res.status(500).send('Authentication failed');
  }
});

// api endpoint for scanning the drive and fetching images/videos
// 1. נתיב הסריקה המעודכן - מאתר כפילויות ומחזיר רק אותן
app.get('/api/drive/scan', async (req, res) => {
  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    let allFiles: any[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const requestParams: any = {
        // הסינון החדש מוסיף את התנאי שאתה חייב להיות הבעלים של הקובץ
        q: "(mimeType contains 'image/' or mimeType contains 'video/') and 'me' in owners",
        fields: 'nextPageToken, files(id, name, mimeType, size, md5Checksum, webViewLink, thumbnailLink, imageMediaMetadata)',
        pageSize: 1000,
      };

      if (pageToken) {
        requestParams.pageToken = pageToken;
      }

      const response = await drive.files.list(requestParams);

      if (response.data.files) {
        allFiles = allFiles.concat(response.data.files);
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    const groups: Record<string, any[]> = {};
    allFiles.forEach(file => {
      const captureTime = file.imageMediaMetadata?.time;
      const key = captureTime ? `time_${captureTime}` : `md5_${file.md5Checksum}`;
      
      if (captureTime || file.md5Checksum) {
        if (!groups[key]) groups[key] = [];
        groups[key].push(file);
      }
    });

    const duplicateGroups = Object.entries(groups)
      .filter(([_, group]) => group.length > 1)
      .map(([key, group]) => {
        group.sort((a, b) => parseInt(b.size || '0') - parseInt(a.size || '0'));
        
        const isQualityDuplicate = key.startsWith('time_') && 
                                   group.some(f => f.md5Checksum !== group[0].md5Checksum);

        return {
          type: isQualityDuplicate ? 'quality' : 'exact',
          files: group
        };
      });

    res.json({
      success: true,
      totalScanned: allFiles.length,
      duplicateGroups: duplicateGroups
    });
    
  } catch (error) {
    console.error('Error scanning drive:', error);
    res.status(500).json({ success: false, message: 'Failed to scan drive' });
  }
});

// 2. נתיב חדש - מוריד את התמונה מהדרייב ומזרים אותה ישירות ל-React
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

    // מעבירים לדפדפן את הסטטוס (200/206) וההדרים הרלוונטיים
    res.status(response.status);
    for (const h of ['content-type', 'content-length', 'content-range']) {
      const v = response.headers[h];
      if (v) res.setHeader(h, v as string);
    }
    res.setHeader('Accept-Ranges', 'bytes');

    // אם הדפדפן סגר את החיבור (למשל דילג הלאה), מפסיקים להוריד מגוגל
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