import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

app.listen(env.PORT, async () => {
  console.log(`Server is running on http://localhost:${env.PORT}`);
  try {
    await prisma.$queryRaw`SELECT NOW()`;
    console.log('✅ Connected to PostgreSQL (Neon) via Prisma');
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL:', error);
  }
});
