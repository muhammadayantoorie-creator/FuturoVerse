/**
 * Vercel Serverless Function entry point.
 * Wraps the main Express app for Vercel deployment.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app, initializeDatabase } from '../server';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await initializeDatabase();
  let pathUrl = req.url || '/';

  // 1. If path is query-forwarded via vercel rewrite ($1)
  if (req.query?.path) {
    const p = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    pathUrl = `/api/${p}`;
  } else if (pathUrl === '/api/index' || pathUrl === '/index' || pathUrl.startsWith('/api/index?')) {
    const matchPath = (req.headers['x-matched-path'] as string) || (req.headers['x-vercel-rewrite-url'] as string);
    const rawMatches = req.headers['x-now-route-matches'] as string;

    if (matchPath && matchPath !== '/api/index' && matchPath !== '/index') {
      pathUrl = matchPath;
    } else if (rawMatches) {
      const match = rawMatches.match(/1=([^&]+)/);
      if (match && match[1]) {
        pathUrl = `/api/${decodeURIComponent(match[1])}`;
      }
    }
  }

  // Ensure /api prefix is present for Express route matching
  if (!pathUrl.startsWith('/api')) {
    pathUrl = `/api${pathUrl.startsWith('/') ? '' : '/'}${pathUrl}`;
  }

  req.url = pathUrl;

  // If Vercel already parsed the body, flag it so express.json() does not hang
  if (req.body && typeof req.body === 'object') {
    (req as any)._body = true;
  }

  return app(req as any, res as any);
}
