import type { Request, Response } from 'express';

/**
 * Fonction serverless Vercel — même API honnête que server.ts
 * (source unique : server/api.ts).
 *
 * Deux protections apprises à la dure :
 *
 * 1. **Chargement paresseux.** Si un module de l'API échoue au chargement
 *    (dépendance absente du bundle, interop ESM/CJS, variable illisible), la
 *    plateforme renvoyait « 500 FUNCTION_INVOCATION_FAILED » — une page HTML
 *    muette. En important le routeur *dans* le gestionnaire, l'échec devient
 *    une réponse JSON avec un code, et la pile part dans les journaux.
 * 2. **Sonde de vie.** `/api/__ping` répond sans charger le routeur : elle
 *    distingue « la fonction s'exécute » de « l'application plante au
 *    démarrage », ce qui est exactement l'information qui manquait.
 */

type RouteurExpress = (req: Request, res: Response, suite: () => void) => void;

let routeur: RouteurExpress | null = null;
let chargement: Promise<RouteurExpress> | null = null;
let erreurChargement: unknown = null;

async function obtenirRouteur(): Promise<RouteurExpress> {
  if (routeur) return routeur;
  // Un échec de chargement est mémorisé : inutile de réessayer à chaque appel
  // pendant la même instance, et la cause reste consultable.
  if (erreurChargement) throw erreurChargement;
  if (!chargement) {
    chargement = import('../server/api.js')
      .then((module) => {
        const app = module.createApiApp() as unknown as RouteurExpress;
        routeur = app;
        return app;
      })
      .catch((e: unknown) => {
        erreurChargement = e;
        chargement = null;
        throw e;
      });
  }
  return chargement;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  const chemin = typeof req.query?.__path === 'string' ? req.query.__path.trim() : '';

  // Sonde de vie : aucune dépendance, aucune écriture, aucun secret.
  if (chemin === '__ping' || (req.url ?? '').startsWith('/__ping')) {
    res.status(200).json({ ok: true, fonction: 'vivante' });
    return;
  }

  try {
    const app = await obtenirRouteur();

    if (chemin) {
      // Vercel réécrit /api/<reste> vers /api/index.ts?__path=<reste>.
      // Le routeur est monté « nu » ici : les routes sont /status, /auth/…
      delete (req.query as Record<string, unknown>).__path;
      const [sousChemin, recherche] = chemin.split('?');
      req.url = '/' + sousChemin.replace(/^\/+/, '') + (recherche ? '?' + recherche : '');
    }

    req.url = req.url || '/status';
    app(req, res, () => {
      if (!res.headersSent) {
        res.status(404).json({ error: 'Ressource introuvable.', code: 'introuvable' });
      }
    });
  } catch (e) {
    // Même une exception au chargement doit rester du JSON : le navigateur ne
    // sait rien faire d'une page d'erreur HTML renvoyée sous /api.
    console.error(
      '[api] échec du chargement ou de l’exécution du routeur —',
      e instanceof Error ? (e.stack ?? e.message) : e,
    );
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erreur interne du service.', code: 'interne' });
    }
  }
}
