/**
 * Administration du référentiel documentaire.
 *
 * Aucune de ces routes n'est accessible sans le rôle administrateur, qui
 * vient de `AURA_ADMIN_EMAILS` (voir server/auth/admin.ts). Il n'y a **pas**
 * de second système d'authentification : on réutilise `authRequise` et
 * `adminRequise`, comme le reste de l'administration.
 *
 * L'interface d'administration n'est pas ici : ces routes sont l'API. Elles
 * restent utilisables avec `curl` même si le panel évolue.
 */
import express, { type Request, type Response } from 'express';
import { adminRequise } from '../auth/admin.js';
import { ingerer, changerStatut, reindexer, supprimer } from '../savoir/indexer.js';
import { encodeurDisponible } from '../savoir/plongement.js';
import { rechercher } from '../savoir/recherche.js';
import {
  ajouterSource,
  changerStatutSource,
  CANDIDATS_BENIN,
  retirerSource,
  semerCandidatsBenin,
} from '../savoir/sources.js';
import {
  ErreurSavoir,
  journalLire,
  lireIndex,
  lireRessource,
  listerRessources,
  listerSources,
  statistiquesSavoir,
} from '../savoir/stockage.js';
import { domaineValide } from '../savoir/domaines.js';
import type { NiveauAutorite, StatutRessource } from '../savoir/types.js';
import { asyncRoute, authRequise, invalide, limiteParCompte } from './middlewares.js';
import type { ReqV1 } from './middlewares.js';

const STATUTS: StatutRessource[] = ['actif', 'a-verifier', 'expire', 'archive'];
const NIVEAUX: NiveauAutorite[] = ['A', 'B', 'C'];

function qui(req: Request): string {
  return (req as ReqV1).compte?.email ?? '(inconnu)';
}

function erreurSavoir(res: Response, e: unknown): void {
  if (e instanceof ErreurSavoir) {
    res.status(e.statut).json({ error: e.message, code: e.code });
    return;
  }
  const message = e instanceof Error ? e.message : 'Erreur du référentiel.';
  res.status(500).json({ error: message, code: 'savoir-echec' });
}

export function createRoutesSavoir(): express.Router {
  const r = express.Router();
  const garde = [authRequise, adminRequise, limiteParCompte(240, 5 * 60 * 1000)];
  // L'ingestion est l'opération la plus coûteuse : plafond dédié.
  const gardeIngestion = [authRequise, adminRequise, limiteParCompte(20, 10 * 60 * 1000)];

  /* ── État ── */

  r.get(
    '/etat',
    ...garde,
    asyncRoute(async (_req: Request, res: Response) => {
      try {
        const stats = await statistiquesSavoir();
        const sources = await listerSources();
        const encodeur = encodeurDisponible();
        res.json({
          ...stats,
          recherche: encodeur ? 'hybride' : 'lexicale',
          embeddings: encodeur ? encodeur.id : null,
          avertissementsEmbeddings: encodeur
            ? []
            : ['Aucun fournisseur d’embeddings configuré : recherche lexicale (BM25) uniquement.'],
          hotesAutorises: sources.filter((s) => s.statut === 'actif').map((s) => s.hote),
          hotesEnAttente: sources.filter((s) => s.statut !== 'actif').map((s) => s.hote),
          candidatsProposes: CANDIDATS_BENIN.length,
          candidatsAbsents: CANDIDATS_BENIN.filter((c) => !sources.some((s) => s.hote === c.hote)).length,
        });
      } catch (e) {
        erreurSavoir(res, e);
      }
    }),
  );

  /* ── Ressources ── */

  r.get(
    '/ressources',
    ...garde,
    asyncRoute(async (req: Request, res: Response) => {
      try {
        const domaine = typeof req.query.domaine === 'string' ? req.query.domaine : null;
        const statut = typeof req.query.statut === 'string' ? req.query.statut : null;
        const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
        let ressources = await listerRessources();
        if (domaine) ressources = ressources.filter((x) => x.domaine === domaine);
        if (statut) ressources = ressources.filter((x) => x.statut === statut);
        if (q) {
          ressources = ressources.filter(
            (x) =>
              x.titre.toLowerCase().includes(q) ||
              x.organisme.toLowerCase().includes(q) ||
              x.description.toLowerCase().includes(q),
          );
        }
        res.json({
          ressources: ressources.slice(0, 200).map((x) => ({
            ...x,
            avertissements: x.avertissements.slice(0, 5),
          })),
          total: ressources.length,
        });
      } catch (e) {
        erreurSavoir(res, e);
      }
    }),
  );

  r.get(
    '/ressources/:id',
    ...garde,
    asyncRoute(async (req: Request, res: Response) => {
      try {
        const ressource = await lireRessource(req.params.id);
        if (!ressource) {
          res.status(404).json({ error: 'Ressource introuvable.', code: 'introuvable' });
          return;
        }
        const index = await lireIndex(req.params.id);
        res.json({
          ressource,
          segments: (index?.segments ?? []).map((s) => ({
            ordre: s.ordre,
            longueur: s.texte.length,
            extrait: s.texte.slice(0, 400),
            vecteur: Boolean(s.vecteur),
          })),
          vecteurDim: index?.vecteurDim ?? null,
        });
      } catch (e) {
        erreurSavoir(res, e);
      }
    }),
  );

  r.post(
    '/ressources',
    ...gardeIngestion,
    asyncRoute(async (req: Request, res: Response) => {
      const corps = (req.body ?? {}) as Record<string, unknown>;
      const domaine = domaineValide(corps.domaine);
      if (!domaine) {
        invalide(res, { domaine: 'domaine-inconnu' });
        return;
      }
      const niveau = corps.niveau;
      if (typeof niveau !== 'string' || !NIVEAUX.includes(niveau as NiveauAutorite)) {
        invalide(res, { niveau: 'A, B ou C attendu' });
        return;
      }
      if (typeof corps.url !== 'string' && typeof corps.texte !== 'string') {
        invalide(res, { source: 'url ou texte requis' });
        return;
      }
      try {
        const resultat = await ingerer({
          url: typeof corps.url === 'string' ? corps.url : undefined,
          texte: typeof corps.texte === 'string' ? corps.texte : undefined,
          titre: typeof corps.titre === 'string' ? corps.titre : undefined,
          description: typeof corps.description === 'string' ? corps.description : undefined,
          domaine,
          pays: typeof corps.pays === 'string' ? corps.pays : undefined,
          organisme: typeof corps.organisme === 'string' ? corps.organisme : undefined,
          niveau: niveau as NiveauAutorite,
          langue: corps.langue === 'en' ? 'en' : 'fr',
          sousDomaine: typeof corps.sousDomaine === 'string' ? corps.sousDomaine : null,
          publication: typeof corps.publication === 'string' ? corps.publication : null,
          par: qui(req),
        });
        res.status(resultat.ok ? 201 : 422).json(resultat);
      } catch (e) {
        erreurSavoir(res, e);
      }
    }),
  );

  r.post(
    '/ressources/:id/reindexer',
    ...gardeIngestion,
    asyncRoute(async (req: Request, res: Response) => {
      try {
        const resultat = await reindexer(req.params.id, qui(req));
        res.status(resultat.ok ? 200 : 422).json(resultat);
      } catch (e) {
        erreurSavoir(res, e);
      }
    }),
  );

  r.post(
    '/ressources/:id/statut',
    ...garde,
    asyncRoute(async (req: Request, res: Response) => {
      const corps = (req.body ?? {}) as { statut?: unknown; note?: unknown };
      if (typeof corps.statut !== 'string' || !STATUTS.includes(corps.statut as StatutRessource)) {
        invalide(res, { statut: 'actif, a-verifier, expire ou archive attendu' });
        return;
      }
      try {
        const ressource = await changerStatut(
          req.params.id,
          corps.statut as StatutRessource,
          qui(req),
          typeof corps.note === 'string' ? corps.note : '',
        );
        res.json({ ok: true, ressource });
      } catch (e) {
        erreurSavoir(res, e);
      }
    }),
  );

  r.delete(
    '/ressources/:id',
    ...garde,
    asyncRoute(async (req: Request, res: Response) => {
      try {
        await supprimer(req.params.id, qui(req));
        res.json({ ok: true });
      } catch (e) {
        erreurSavoir(res, e);
      }
    }),
  );

  /* ── Catalogue de sources ── */

  r.get(
    '/sources',
    ...garde,
    asyncRoute(async (_req: Request, res: Response) => {
      try {
        res.json({ sources: await listerSources(), candidats: CANDIDATS_BENIN });
      } catch (e) {
        erreurSavoir(res, e);
      }
    }),
  );

  r.post(
    '/sources',
    ...garde,
    asyncRoute(async (req: Request, res: Response) => {
      const corps = (req.body ?? {}) as Record<string, unknown>;
      const domaines = Array.isArray(corps.domaines)
        ? corps.domaines.map((d) => domaineValide(d)).filter((d): d is NonNullable<typeof d> => d !== null)
        : [];
      if (
        typeof corps.nom !== 'string' ||
        typeof corps.hote !== 'string' ||
        typeof corps.url !== 'string' ||
        typeof corps.niveau !== 'string' ||
        !NIVEAUX.includes(corps.niveau as NiveauAutorite) ||
        domaines.length === 0
      ) {
        invalide(res, { source: 'nom, hôte, url, niveau (A/B/C) et au moins un domaine requis' });
        return;
      }
      try {
        const source = await ajouterSource(
          {
            nom: corps.nom,
            organisme: typeof corps.organisme === 'string' ? corps.organisme : corps.nom,
            hote: corps.hote,
            url: corps.url,
            niveau: corps.niveau as NiveauAutorite,
            domaines,
            statut: corps.statut === 'actif' ? 'actif' : 'a-verifier',
            note: typeof corps.note === 'string' ? corps.note : null,
          },
          qui(req),
        );
        res.status(201).json({ source });
      } catch (e) {
        erreurSavoir(res, e);
      }
    }),
  );

  r.post(
    '/sources/semer',
    ...garde,
    asyncRoute(async (req: Request, res: Response) => {
      try {
        const resultat = await semerCandidatsBenin(qui(req));
        res.json({
          ...resultat,
          rappel:
            'Ces sources sont créées au statut « à vérifier » : aucune collecte n’est possible avant activation explicite.',
        });
      } catch (e) {
        erreurSavoir(res, e);
      }
    }),
  );

  r.post(
    '/sources/:id/statut',
    ...garde,
    asyncRoute(async (req: Request, res: Response) => {
      const corps = (req.body ?? {}) as { statut?: unknown };
      const statuts = ['actif', 'a-verifier', 'desactive'] as const;
      if (
        typeof corps.statut !== 'string' ||
        !statuts.includes(corps.statut as (typeof statuts)[number])
      ) {
        invalide(res, { statut: 'actif, a-verifier ou desactive attendu' });
        return;
      }
      try {
        const source = await changerStatutSource(
          req.params.id,
          corps.statut as (typeof statuts)[number],
          qui(req),
        );
        res.json({ ok: true, source });
      } catch (e) {
        erreurSavoir(res, e);
      }
    }),
  );

  r.delete(
    '/sources/:id',
    ...garde,
    asyncRoute(async (req: Request, res: Response) => {
      try {
        await retirerSource(req.params.id, qui(req));
        res.json({ ok: true });
      } catch (e) {
        erreurSavoir(res, e);
      }
    }),
  );

  /* ── Diagnostic de recherche (aucun appel au modèle) ── */

  r.post(
    '/recherche',
    ...garde,
    asyncRoute(async (req: Request, res: Response) => {
      const corps = (req.body ?? {}) as { question?: unknown; limite?: unknown };
      if (typeof corps.question !== 'string' || corps.question.trim().length < 3) {
        invalide(res, { question: 'question trop courte' });
        return;
      }
      try {
        const resultat = await rechercher({
          question: corps.question,
          limite: typeof corps.limite === 'number' ? corps.limite : 8,
        });
        res.json(resultat);
      } catch (e) {
        erreurSavoir(res, e);
      }
    }),
  );

  r.get(
    '/journal',
    ...garde,
    asyncRoute(async (_req: Request, res: Response) => {
      try {
        res.json({ entrees: await journalLire() });
      } catch (e) {
        erreurSavoir(res, e);
      }
    }),
  );

  return r;
}
