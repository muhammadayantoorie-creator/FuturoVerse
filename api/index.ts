/**
 * Vercel Serverless Function entry point.
 * Wraps the main Express app for Vercel deployment.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../server';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Ensure req.url retains /api prefix matching server.ts route definitions
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }
  return app(req, res);
}
