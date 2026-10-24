import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { apiRouter } from './routes/api.js';

// Translate errors into deliberate HTTP statuses so invalid input never surfaces as a 500.
function statusFor(error: Error & { status?: number; code?: number }) {
  if (error.status) return error.status;
  if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) return 400;
  if (error.code === 11000) return 409;
  if (error instanceof SyntaxError) return 400;
  return 500;
}

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get('/health', (_request, response) => response.json({ ok: true }));
  app.use('/api', apiRouter);
  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'Not found' });
  });
  app.use((error: Error & { status?: number; code?: number }, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const status = statusFor(error);
    response.status(status).json({ error: status === 500 ? 'Internal server error' : error.message });
  });
  return app;
}
