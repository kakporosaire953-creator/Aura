import type { Request, Response } from 'express';
import { apiApp } from '../src/server/apiApp.ts';

export default function handler(req: Request, res: Response) {
  // 1. Recover the true client path when Vercel rewrites /api/(.*)
  const qAny = req.query as Record<string, unknown> | undefined;
  const vercelPath = qAny?.__path;

  if (typeof vercelPath === 'string' && vercelPath.trim()) {
    if (qAny) {
      delete qAny.__path;
    }
    const [subpath, search] = vercelPath.split('?');
    const cleanSubpath = subpath.replace(/^\/+/, '');
    req.url = '/api/' + cleanSubpath + (search ? '?' + search : '');
  } else {
    // Check headers sent by Vercel Edge proxy
    const forwardedUri =
      (req.headers['x-forwarded-uri'] as string) ||
      (req.headers['x-original-url'] as string) ||
      (req.headers['x-real-url'] as string);

    if (forwardedUri && forwardedUri.startsWith('/api') && !forwardedUri.includes('api/index')) {
      req.url = forwardedUri;
    } else {
      const rawMatched =
        (req.headers['x-matched-path'] as string) ||
        (req.headers['x-vercel-matched-path'] as string);

      if (rawMatched && rawMatched.startsWith('/api') && !rawMatched.includes('api/index')) {
        req.url = rawMatched;
      } else if (req.url) {
        if (req.url.startsWith('/api/index') || req.url === '/api' || req.url === '/') {
          if (forwardedUri && !forwardedUri.includes('api/index')) {
            req.url = forwardedUri;
          } else {
            req.url = '/api';
          }
        } else if (!req.url.startsWith('/api') && !req.url.startsWith('/?')) {
          req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
        }
      }
    }
  }

  // 2. Prevent body-parser from hanging on pre-buffered Vercel serverless request bodies
  const rawAny = req as unknown as { body?: unknown; _body?: boolean };
  if (rawAny.body && typeof rawAny.body === 'object') {
    rawAny._body = true;
  }

  return apiApp(req, res);
}

