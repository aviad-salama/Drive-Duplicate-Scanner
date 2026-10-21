import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

async function startServer(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error('Startup failed: PostgreSQL connection is unavailable.');

    if (env.NODE_ENV !== 'production') {
      console.error(error);
    }

    await prisma.$disconnect().catch(() => undefined);
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`API ready at http://localhost:${env.PORT}`);
  });
}

startServer();
