import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

async function startServer(): Promise<void> {
  await connectDatabase();

  createApp().listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT}`);
  });
}

startServer().catch((error: unknown) => {
  console.error('Unable to start API server', error);
  process.exit(1);
});
