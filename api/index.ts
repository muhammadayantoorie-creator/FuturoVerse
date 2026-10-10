/**
 * Vercel Serverless Function entry point.
 * Wraps the main Express app for Vercel deployment.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
// @ts-ignore
import serverModule from '../dist/server.js';
const app = serverModule?.app || serverModule?.default?.app || serverModule?.default || serverModule;
const initializeDatabase = serverModule?.initializeDatabase || serverModule?.default?.initializeDatabase || (() => Promise.resolve());

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
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

    // Fast health check endpoint
    if (pathUrl === '/api/health' || pathUrl === '/api/ping') {
      return res.status(200).json({ status: 'ok', serverless: true, time: new Date().toISOString() });
    }

    try {
      await initializeDatabase();
    } catch (dbErr: any) {
      console.warn('Database initialization warning in serverless handler:', dbErr?.message || dbErr);
    }

    req.url = pathUrl;
    (req as any).originalUrl = pathUrl;

    // If Vercel already parsed the body, flag it so express.json() does not hang
    if (req.body && typeof req.body === 'object') {
      (req as any)._body = true;
    }

    // Return a Promise that resolves when Express finishes writing the response
    return new Promise((resolve) => {
      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          resolve(undefined);
        }
      };

      res.on('finish', done);
      res.on('close', done);

      app(req as any, res as any, (err?: any) => {
        if (err) {
          console.error('Express middleware unhandled error:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error', message: err?.message });
          }
        }
        done();
      });
    });
  } catch (fatalErr: any) {
    console.error('Fatal Vercel handler error:', fatalErr);
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Serverless Function Execution Error',
        message: fatalErr?.message || String(fatalErr),
      });
    }
  }
}
