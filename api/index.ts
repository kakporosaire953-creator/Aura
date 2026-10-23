import type { Request, Response } from 'express';
import { createApiApp } from '../server/api';

/**
 * Fonction serverless Vercel — même API honnête que server.ts
 * (source unique : server/api.ts). Les fonctionnalités du moteur
 * reviennent par étapes ; cet endpoint ne décrit que ce qui existe
 * réellement.
 */
export default function handler(req: Request, res: Response) {
  const qAny = req.query as Record<string, unknown> | undefined;
  const vercelPath = qAny?.__path;
  if (typeof vercelPath === 'string' && vercelPath.trim() && qAny) {
    delete qAny.__path;
    const [subpath, search] = vercelPath.split('?');
    // Le routeur est monté « nu » ici : les routes sont /status, /auth/...
    // (pas de préfixe /api — Express ne le retire que via app.use('/api', …)).
    req.url = '/' + subpath.replace(/^\/+/, '') + (search ? '?' + search : '');
  }

  const router = createApiApp();

  req.url = req.url || '/status';
  router(req, res, () => {
    res.status(404).json({ error: 'introuvable' });
  });
}
