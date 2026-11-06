/**
 * API v1 — projets, missions (avec assistance IA validable) et mémoire.
 * L'IA propose ; l'utilisateur valide avant tout enregistrement.
 */
import express, { type Response } from 'express';
import {
  authRequise,
  asyncRoute,
  bool,
  chaine,
  enumere,
  erreur404,
  invalide,
  limiteParCompte,
  type ReqV1,
} from './middlewares';
import { nouvelId } from '../db/entrepots';
import type {
  Memoire,
  Mission,
  PrioriteMission,
  StatutMission,
  TypeMemoire,
} from '../db/types';
import * as serviceIa from '../ai/service';
import { ErreurAi } from '../ai/errors';
import { enregistrerUsage } from '../ai/usage';

const STATUTS: readonly StatutMission[] = ['a_faire', 'en_cours', 'en_attente', 'terminee', 'archivee'];
const PRIORITES: readonly PrioriteMission[] = ['basse', 'moyenne', 'haute', 'urgente'];
const TYPES_MEMOIRE: readonly TypeMemoire[] = [
  'preference',
  'contexte_personnel',
  'preference_reponse',
  'professionnel',
  'instruction_projet',
  'temporaire',
];

export function createRoutesTravail(): express.Router {
  const w = express.Router();
  w.use(authRequise);

  /* ── Projets ── */

  w.get('/projets', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const liste = await r.donnees!.projets({
      inclureArchives: req.query.archives === '1',
    });
    res.json({ projets: liste });
  }));

  w.post('/projets', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const corps = (req.body ?? {}) as Record<string, unknown>;
    const nom = chaine(corps.nom, { min: 1, max: 120 });
    if (nom === undefined || nom === null) {
      invalide(res, { nom: 'invalide' });
      return;
    }
    const description = chaine(corps.description, { max: 2000, defaut: '' }) ?? '';
    const objectif = chaine(corps.objectif, { max: 2000, defaut: '' }) ?? '';
    const categorie = chaine(corps.categorie, { max: 60, defaut: '' }) ?? '';
    const instructions = chaine(corps.instructions, { max: 8000, defaut: '' }) ?? '';
    const projet = await r.donnees!.creerProjet({
      id: nouvelId('prj'),
      nom,
      description,
      objectif,
      categorie,
      instructions,
      statut: 'actif',
      cree: new Date().toISOString(),
      maj: new Date().toISOString(),
    });
    res.status(201).json({ projet });
  }));

  w.get('/projets/:id', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const projet = await r.donnees!.projet(req.params.id);
    if (!projet) {
      erreur404(res);
      return;
    }
    const [conversations, missions, memoires, creations, recherches] = await Promise.all([
      r.donnees!.conversations(),
      r.donnees!.missions({ projectId: projet.id }),
      r.donnees!.memoires({ projectId: projet.id }),
      r.donnees!.creations(),
      r.donnees!.recherches(),
    ]);
    res.json({
      projet,
      conversations: conversations.filter((c) => c.projectId === projet.id),
      missions,
      memoires,
      creations: creations.filter((c) => c.projectId === projet.id),
      recherches: recherches.filter((s) => s.projectId === projet.id),
    });
  }));

  w.patch('/projets/:id', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const corps = (req.body ?? {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    const champs: Record<string, string> = {};
    const nom = chaine(corps.nom, { min: 1, max: 120 });
    if (corps.nom !== undefined && (nom === undefined || nom === null)) champs.nom = 'invalide';
    if (nom) patch.nom = nom;
    for (const [cle, max] of [['description', 2000], ['objectif', 2000], ['categorie', 60], ['instructions', 8000]] as const) {
      const v = chaine(corps[cle], { max });
      if (corps[cle] !== undefined && v === undefined) champs[cle] = 'invalide';
      if (v !== undefined) patch[cle] = v;
    }
    const statut = enumere(corps.statut, ['actif', 'archive'] as const);
    if (corps.statut !== undefined && !statut) champs.statut = 'invalide';
    if (statut) patch.statut = statut;
    if (Object.keys(champs).length) {
      invalide(res, champs);
      return;
    }
    const maj = await r.donnees!.majProjet(req.params.id, patch);
    if (!maj) {
      erreur404(res);
      return;
    }
    res.json({ projet: maj });
  }));

  w.delete('/projets/:id', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const ok = await r.donnees!.supprimerProjet(req.params.id);
    if (!ok) {
      erreur404(res);
      return;
    }
    res.status(204).end();
  }));

  /* ── Missions ── */

  w.get('/missions', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const opts: { projectId?: string | null; statut?: string } = {};
    if (req.query.projectId !== undefined) {
      opts.projectId = req.query.projectId === 'null' ? null : String(req.query.projectId);
    }
    if (req.query.statut) opts.statut = String(req.query.statut);
    const liste = await r.donnees!.missions(opts);
    res.json({ missions: liste });
  }));

  w.post('/missions', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const mission = await creerMissionDepuisCorps(r, req.body, res);
    if (mission) res.status(201).json({ mission });
  }));

  /** Enregistrement groupé après validation utilisateur d'une proposition IA. */
  w.post('/missions/batch', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const corps = (req.body ?? {}) as { missions?: unknown[]; projectId?: unknown };
    if (!Array.isArray(corps.missions) || corps.missions.length === 0 || corps.missions.length > 20) {
      invalide(res, { missions: 'invalide' });
      return;
    }
    const creees: Mission[] = [];
    for (const brut of corps.missions) {
      const m = await creerMissionDepuisCorps(r, brut, res, { nePasRepondre: true, projectId: corps.projectId });
      if (!m) return; // réponse 400 déjà envoyée
      creees.push(m);
    }
    res.status(201).json({ missions: creees });
  }));

  /**
   * Assistance IA : décomposition d'un objectif en missions proposées.
   * Rien n'est enregistré — l'utilisateur valide ou modifie ensuite.
   */
  w.post(
    '/missions/aide',
    limiteParCompte(12, 5 * 60 * 1000),
    asyncRoute(async (req, res) => {
      const r = req as ReqV1;
      const corps = (req.body ?? {}) as Record<string, unknown>;
      const objectif = chaine(corps.objectif, { min: 3, max: 2000 });
      if (objectif === undefined || objectif === null) {
        invalide(res, { objectif: 'invalide' });
        return;
      }
      try {
        const proposition = await serviceIa.genererStructure<{ missions: Array<{
          titre: string;
          description: string;
          priorite: PrioriteMission;
          echeance: string | null;
          sousTaches: string[];
        }> }>(
          'structure',
          {
            messages: [
              {
                role: 'user',
                content:
                  `Décompose l'objectif suivant en 3 à 8 missions concrètes et ordonnées.\n\n` +
                  `Objectif : ${objectif}`,
              },
            ],
            system:
              'Tu es un assistant d\'organisation de travail. Propose des missions actionnables, réalistes, sans inventer de contraintes externes. Réponds uniquement via le schéma JSON demandé.',
            schema: {
              type: 'object',
              properties: {
                missions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      titre: { type: 'string' },
                      description: { type: 'string' },
                      priorite: { type: 'string', enum: [...PRIORITES] },
                      echeance: { type: ['string', 'null'] },
                      sousTaches: { type: 'array', items: { type: 'string' } },
                    },
                    required: ['titre', 'description', 'priorite', 'sousTaches'],
                  },
                },
              },
              required: ['missions'],
            },
          },
          { noter: (t) => enregistrerUsage(r.donnees, t) },
        );
        const missions = (proposition.missions ?? [])
          .slice(0, 10)
          .map((m) => ({
            titre: String(m.titre ?? '').slice(0, 120),
            description: String(m.description ?? '').slice(0, 2000),
            priorite: (PRIORITES as readonly string[]).includes(m.priorite) ? m.priorite : 'moyenne',
            echeance: typeof m.echeance === 'string' && /^\d{4}-\d{2}-\d{2}/.test(m.echeance) ? m.echeance.slice(0, 10) : null,
            sousTaches: (Array.isArray(m.sousTaches) ? m.sousTaches : [])
              .slice(0, 10)
              .map((s) => String(s).slice(0, 200)),
          }))
          .filter((m) => m.titre);
        await r.donnees!.enregistrerEvenement({
          id: nouvelId('evt'),
          genre: 'mission_aide',
          cree: new Date().toISOString(),
          meta: { proposees: missions.length },
        });
        res.json({ proposition: missions, note: 'Proposition non enregistrée : validez pour créer les missions.' });
      } catch (e) {
        if (e instanceof ErreurAi) {
          res.status(e.statut).json({ error: e.message, code: e.code });
          return;
        }
        res.status(502).json({ error: 'Le moteur IA est indisponible.', code: 'modele-indisponible' });
      }
    }),
  );

  w.get('/missions/:id', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const mission = await r.donnees!.mission(req.params.id);
    if (!mission) {
      erreur404(res);
      return;
    }
    res.json({ mission });
  }));

  w.patch('/missions/:id', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const corps = (req.body ?? {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    const champs: Record<string, string> = {};

    const titre = chaine(corps.titre, { min: 1, max: 120 });
    if (corps.titre !== undefined && (titre === undefined || titre === null)) champs.titre = 'invalide';
    if (titre) patch.titre = titre;
    const description = chaine(corps.description, { max: 4000 });
    if (corps.description !== undefined && description === undefined) champs.description = 'invalide';
    if (description !== undefined) patch.description = description;
    const statut = enumere(corps.statut, STATUTS);
    if (corps.statut !== undefined && !statut) champs.statut = 'invalide';
    if (statut) patch.statut = statut;
    const priorite = enumere(corps.priorite, PRIORITES);
    if (corps.priorite !== undefined && !priorite) champs.priorite = 'invalide';
    if (priorite) patch.priorite = priorite;
    const notes = chaine(corps.notes, { max: 4000 });
    if (corps.notes !== undefined && notes === undefined) champs.notes = 'invalide';
    if (notes !== undefined) patch.notes = notes;
    if (corps.echeance !== undefined) {
      if (corps.echeance === null) {
        patch.echeance = null;
      } else if (typeof corps.echeance === 'string' && /^\d{4}-\d{2}-\d{2}/.test(corps.echeance)) {
        patch.echeance = corps.echeance.slice(0, 10);
      } else {
        champs.echeance = 'invalide';
      }
    }
    if (typeof corps.ordre === 'number' && Number.isFinite(corps.ordre)) {
      patch.ordre = Math.round(corps.ordre);
    }
    if (corps.sousTaches !== undefined) {
      if (!Array.isArray(corps.sousTaches) || corps.sousTaches.length > 30) {
        champs.sousTaches = 'invalide';
      } else {
        const existante = await r.donnees!.mission(req.params.id);
        const anciennes = new Map((existante?.sousTaches ?? []).map((s) => [s.id, s]));
        patch.sousTaches = corps.sousTaches.map((s: { id?: unknown; titre?: unknown; fait?: unknown }) => ({
          id: typeof s?.id === 'string' && anciennes.has(s.id) ? s.id : nouvelId('st'),
          titre: String(s?.titre ?? '').trim().slice(0, 200),
          fait: s?.fait === true,
        })).filter((s: { titre: string }) => s.titre);
      }
    }
    if (corps.projectId !== undefined) {
      if (corps.projectId === null) {
        patch.projectId = null;
      } else if (typeof corps.projectId === 'string' && (await r.donnees!.projet(corps.projectId))) {
        patch.projectId = corps.projectId;
      } else {
        champs.projectId = 'invalide';
      }
    }
    if (Object.keys(champs).length) {
      invalide(res, champs);
      return;
    }
    const maj = await r.donnees!.majMission(req.params.id, patch);
    if (!maj) {
      erreur404(res);
      return;
    }
    res.json({ mission: maj });
  }));

  w.delete('/missions/:id', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const ok = await r.donnees!.supprimerMission(req.params.id);
    if (!ok) {
      erreur404(res);
      return;
    }
    res.status(204).end();
  }));

  /* ── Mémoire ── */

  w.get('/memoires', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const opts: { actives?: boolean; projectId?: string | null } = {};
    if (req.query.actives === '1') opts.actives = true;
    if (req.query.projectId !== undefined) {
      opts.projectId = req.query.projectId === 'null' ? null : String(req.query.projectId);
    }
    const liste = await r.donnees!.memoires(opts);
    res.json({ memoires: liste });
  }));

  w.post('/memoires', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const corps = (req.body ?? {}) as Record<string, unknown>;
    const contenu = chaine(corps.contenu, { min: 1, max: 2000 });
    if (contenu === undefined || contenu === null) {
      invalide(res, { contenu: 'invalide' });
      return;
    }
    const type = enumere(corps.type, TYPES_MEMOIRE) ?? 'contexte_personnel';
    let projectId: string | null = null;
    if (corps.projectId !== undefined && corps.projectId !== null) {
      if (typeof corps.projectId !== 'string' || !(await r.donnees!.projet(corps.projectId))) {
        erreur404(res);
        return;
      }
      projectId = corps.projectId;
    }
    const memoire: Memoire = await r.donnees!.creerMemoire({
      id: nouvelId('mem'),
      projectId,
      type,
      contenu: contenu!,
      actif: true,
      cree: new Date().toISOString(),
      maj: new Date().toISOString(),
    });
    res.status(201).json({ memoire });
  }));

  w.patch('/memoires/:id', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const corps = (req.body ?? {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    const champs: Record<string, string> = {};
    const contenu = chaine(corps.contenu, { min: 1, max: 2000 });
    if (corps.contenu !== undefined && (contenu === undefined || contenu === null)) champs.contenu = 'invalide';
    if (contenu) patch.contenu = contenu;
    const type = enumere(corps.type, TYPES_MEMOIRE);
    if (corps.type !== undefined && !type) champs.type = 'invalide';
    if (type) patch.type = type;
    const actif = bool(corps.actif);
    if (corps.actif !== undefined && actif === undefined) champs.actif = 'invalide';
    if (actif !== undefined) patch.actif = actif;
    if (Object.keys(champs).length) {
      invalide(res, champs);
      return;
    }
    const maj = await r.donnees!.majMemoire(req.params.id, patch);
    if (!maj) {
      erreur404(res);
      return;
    }
    res.json({ memoire: maj });
  }));

  w.delete('/memoires/:id', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const ok = await r.donnees!.supprimerMemoire(req.params.id);
    if (!ok) {
      erreur404(res);
      return;
    }
    res.status(204).end();
  }));

  /** Effacement complet — action destructive, explicitement demandée. */
  w.delete('/memoires', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const n = await r.donnees!.viderMemoires();
    res.json({ supprimees: n });
  }));

  return w;
}

/* ── Helpers ── */

async function creerMissionDepuisCorps(
  r: ReqV1,
  brut: unknown,
  res: Response,
  opts: { nePasRepondre?: boolean; projectId?: unknown } = {},
): Promise<Mission | null> {
  const corps = (brut ?? {}) as Record<string, unknown>;
  const champs: Record<string, string> = {};
  const titre = chaine(corps.titre, { min: 1, max: 120 });
  if (titre === undefined || titre === null) champs.titre = 'invalide';
  const description = chaine(corps.description, { max: 4000, defaut: '' }) ?? '';
  const priorite = enumere(corps.priorite, PRIORITES) ?? 'moyenne';
  const statut = enumere(corps.statut, STATUTS) ?? 'a_faire';
  const notes = chaine(corps.notes, { max: 4000, defaut: '' }) ?? '';
  let echeance: string | null = null;
  if (corps.echeance !== undefined && corps.echeance !== null) {
    if (typeof corps.echeance === 'string' && /^\d{4}-\d{2}-\d{2}/.test(corps.echeance)) {
      echeance = corps.echeance.slice(0, 10);
    } else {
      champs.echeance = 'invalide';
    }
  }
  let projectId: string | null = null;
  const projBrut = corps.projectId ?? opts.projectId;
  if (projBrut !== undefined && projBrut !== null) {
    if (typeof projBrut === 'string' && (await r.donnees!.projet(projBrut))) {
      projectId = projBrut;
    } else {
      champs.projectId = 'invalide';
    }
  }
  let sousTaches: Mission['sousTaches'] = [];
  if (corps.sousTaches !== undefined) {
    if (!Array.isArray(corps.sousTaches) || corps.sousTaches.length > 30) {
      champs.sousTaches = 'invalide';
    } else {
      sousTaches = corps.sousTaches
        .map((s: unknown) => (typeof s === 'string' ? s : String((s as { titre?: unknown })?.titre ?? '')))
        .map((s: string) => s.trim().slice(0, 200))
        .filter(Boolean)
        .map((s: string) => ({ id: nouvelId('st'), titre: s, fait: false }));
    }
  }
  if (Object.keys(champs).length) {
    if (!opts.nePasRepondre) invalide(res, champs);
    else invalide(res, champs);
    return null;
  }
  return r.donnees!.creerMission({
    id: nouvelId('msn'),
    projectId,
    titre: titre!,
    description,
    priorite,
    statut,
    echeance,
    notes,
    ordre: Date.now(),
    sousTaches,
    cree: new Date().toISOString(),
    maj: new Date().toISOString(),
  });
}
