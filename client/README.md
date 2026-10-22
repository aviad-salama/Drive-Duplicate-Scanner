# Drive Duplicate Scanner

A React client and Express API for finding exact duplicate files in Google Drive.

## Requirements

- Node.js 20 or later
- PostgreSQL
- Google OAuth credentials with the Drive API enabled

## Server

```powershell
cd server
npm install
```

Copy `.env.example` to `.env` and fill in the database URL, JWT secret, token encryption key, and Google OAuth credentials. `TOKEN_ENC_KEY` must be 64 hexadecimal characters (32 bytes). The Google OAuth redirect URI must match `GOOGLE_REDIRECT_URI`.

```powershell
npm run generate
npm run migrate:dev
npm run dev
```

## Client

```powershell
cd client
npm install
npm run dev
```

The client uses `http://localhost:3000` for the API by default. Set `VITE_API_URL` in `client/.env` to use a different URL.

Run `npm run lint` and `npm run build` from `client` to check the client.
