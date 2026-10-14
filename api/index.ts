import type { Request, Response } from 'express';
import { apiApp } from '../src/server/apiApp.ts';

export default function handler(req: Request, res: Response) {
  // 1. Recover the true client path when Vercel rewrites /api/(.*) to /api/index.ts
  const rawMatched =
    (req.headers['x-matched-path'] as string) ||
    (req.headers['x-vercel-matched-path'] as string) ||
    (req.headers['x-forwarded-uri'] as string) ||
    (req.headers['x-original-url'] as string);

  if (rawMatched && !rawMatched.includes('api/index')) {
    req.url = rawMatched;
  } else if (req.url) {
    if (req.url.startsWith('/api/index.ts') || req.url === '/api/index' || req.url === '/api') {
      if (rawMatched && !rawMatched.includes('api/index')) {
        req.url = rawMatched;
      }
    } else if (!req.url.startsWith('/api') && !req.url.startsWith('/?')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
  }

  // 2. Prevent body-parser from hanging on pre-buffered Vercel serverless request bodies
  const rawAny = req as unknown as { body?: unknown; _body?: boolean };
  if (rawAny.body && typeof rawAny.body === 'object') {
    rawAny._body = true;
  }

  return apiApp(req, res);
}

