/**
 * Vercel Serverless Function entry point.
 * Wraps the main Express app for Vercel deployment.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../server';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel rewrites may set req.url to "/api/index" (the destination)
  // instead of the original path like "/api/auth/register".
  // We must reconstruct the real URL from Vercel's internal headers.
  const originalUrl =
    (req.headers['x-invoke-path'] as string) ||
    (req.headers['x-matched-path'] as string) ||
    (req.headers['x-vercel-rewrite-url'] as string) ||
    req.url;

  if (originalUrl) {
    // Ensure /api prefix is present for Express route matching
    if (!originalUrl.startsWith('/api')) {
      req.url = `/api${originalUrl.startsWith('/') ? '' : '/'}${originalUrl}`;
    } else {
      req.url = originalUrl;
    }
  }

  // Preserve the full original query string if present
  const queryString = req.url?.includes('?') ? '' : (req.headers['x-query-string'] as string || '');
  if (queryString && req.url && !req.url.includes('?')) {
    req.url = `${req.url}?${queryString}`;
  }

  return app(req as any, res as any);
}
