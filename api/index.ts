import type { Request, Response } from 'express';
import express from 'express';

/**
 * Fonction serverless Vercel — même API honnête que server.ts.
 * Les fonctionnalités du moteur reviennent par étapes ; cet endpoint
 * ne décrit que ce qui existe réellement.
 */
export default function handler(req: Request, res: Response) {
  const qAny = req.query as Record<string, unknown> | undefined;
  const vercelPath = qAny?.__path;
  if (typeof vercelPath === 'string' && vercelPath.trim() && qAny) {
    delete qAny.__path;
    const [subpath, search] = vercelPath.split('?');
    req.url = '/api/' + subpath.replace(/^\/+/, '') + (search ? '?' + search : '');
  }

  const router = express.Router();
  router.use(express.json());
  router.get('/status', (_req2, res2) => {
    res2.json({
      name: 'Aura',
      phase: 'renaissance',
      tagline: "De l'idée au résultat.",
      features: {
        publicSite: 'live',
        intro: 'live',
        sculpture3d: 'live',
        accounts: 'rebuilding',
        chat: 'rebuilding',
        explore: 'rebuilding',
        studio: 'rebuilding',
        missions: 'rebuilding',
      },
    });
  });

  req.url = req.url || '/api/status';
  router(req, res, () => {
    res.status(404).json({ error: 'introuvable' });
  });
}
