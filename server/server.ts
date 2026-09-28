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
    
    const response = await drive.files.list({
      q: "mimeType contains 'image/' or mimeType contains 'video/'",
      fields: 'files(id, name, mimeType, size, md5Checksum, webViewLink, thumbnailLink)', 
      pageSize: 1000, 
    });

    const files = response.data.files || [];
    
    // קיבוץ הקבצים לפי ה-MD5 שלהם
    const groups: Record<string, any[]> = {};
    files.forEach(file => {
      if (file.md5Checksum) {
        if (!groups[file.md5Checksum]) groups[file.md5Checksum] = [];
        groups[file.md5Checksum]!.push(file);
      }
    });

    // סינון: שומרים רק קבוצות שיש בהן 2 קבצים או יותר (כפילויות)
    const duplicates = Object.values(groups).filter(group => group.length > 1);

    res.json({
      success: true,
      totalScanned: files.length,
      duplicateGroups: duplicates
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