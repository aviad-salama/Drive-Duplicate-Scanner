# Drive Duplicate Scanner 

A full-stack web application designed to help users free up cloud storage space by safely identifying and deleting duplicate files across multiple cloud providers (Google Drive & OneDrive).

## ✨ Key Features

* **Multi-Cloud Scanning:** Connect and scan multiple Google Drive and OneDrive accounts simultaneously.
* **Cross-Cloud Duplicate Detection:** Finds exact duplicates even if they are stored in different cloud providers, using smart Hash and Size comparisons.
* **Smart Safety Filters:** Automatically skips 0-byte files, OS system files, and critical development folders (e.g., `node_modules`, `.git`, `.env`) to prevent accidental system breakage.
* **Priority Manager:** Define which cloud drive gets priority to keep the original file, calculating potential storage savings dynamically.
* **Bulk Deletion:** Safely move hundreds of duplicate files to the trash in a single click based on your priority settings.
* **Real-Time Progress & Previews:** Built with Server-Sent Events (SSE) for live scanning progress, alongside secure media streaming for image and video previews.

## 🛠️ Tech Stack

**Frontend:**
* React 19 + TypeScript
* Tailwind CSS
* TanStack Query (React Query)
* React Router

**Backend:**
* Node.js + Express
* Prisma ORM
* PostgreSQL (Neon)
* JWT Authentication & AES-256-GCM Token Encryption
* Google APIs & Microsoft Graph API

## ⚠️ Important Note Regarding Google Login (Security Warning)

Because this is a portfolio/developer project, the Google OAuth integration is currently in "Testing" mode and has not gone through Google's official App Verification process. 

When you log in with Google, you may see a red warning screen stating **"Google hasn't verified this app"**. This is normal for unverified developer apps. 
**To proceed safely:**
1. Click on **Advanced** at the bottom of the warning.
2. Click on **Go to [App Name] (unsafe)**.
3. Grant the required permissions to allow the app to scan and move files to the trash.

## 🚀 Getting Started

### 🌐 Live Demo
You don't need to run this project locally to try it out! 
You can access the live deployed version here: 
**[(https://drive-duplicate-scanner.vercel.app/)]**

*(Please review the "Important Note Regarding Google Login" below if you decide to test the live demo with your Google account).*
### Prerequisites
* Node.js 20+
* PostgreSQL database
* Google Cloud Console Project (with Drive API enabled)
* Microsoft Azure App (for OneDrive integration)

### Server Setup
1. Navigate to the `server` directory: `cd server`
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example` and fill in your Database URL and API keys.
4. Run database migrations: `npm run migrate:dev`
5. Start the server: `npm run dev`

### Client Setup
1. Navigate to the `client` directory: `cd client`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
