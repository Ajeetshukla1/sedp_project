import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { requestIdMiddleware } from './middleware/request-id.middleware.js';

export function createApp(): Express {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json());
  app.use('/api', apiRouter);

  return app;
}
