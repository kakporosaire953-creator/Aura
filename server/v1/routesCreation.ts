/**
 * API v1 — Explorer (recherche sourcée réelle) et Studio (créations avec
 * versions). Sans moteur configuré, ces routes déclarent leur indisponibilité :
 * aucune recherche ni création simulée.
 */
import express from 'express';
import {
  authRequise,
  asyncRoute,
  chaine,
  enumere,
  erreur404,
  erreur503Stockage,
  invalide,
  limiteParCompte,
  type ReqV1,
} from './middlewares.js';
import { nouvelId } from '../db/entrepots.js';
import type { SourceRecherche, TypeCreation, VersionCreation } from '../db/types.js';
import { choisirConnecteur } from '../search/connecteurs.js';
import * as serviceIa from '../ai/service.js';
import { ErreurAi } from '../ai/errors.js';
import { enregistrerUsage } from '../ai/usage.js';

const TYPES_CREATION: readonly TypeCreation[] = [
  'document',
  'resume',
  'rapport',
  'texte_professionnel',
  'publication',
  'presentation',
  'code',
  'plan',
  'creatif',
];

const INSTRUCTIONS_TYPE: Record<TypeCreation, { fr: string; en: string }> = {
  document: {
    fr: 'Rédige un document structuré (titre, sections, conclusion) sur le sujet demandé.',
    en: 'Write a structured document (title, sections, conclusion) on the requested topic.',
  },
  resume: {
    fr: 'Produis un résumé fidèle et hiérarchisé des points essentiels du contenu fourni.',
    en: 'Produce a faithful, hierarchical summary of the key points of the provided content.',
  },
  rapport: {
    fr: 'Rédige un rapport professionnel : contexte, analyse, constats, recommandations.',
    en: 'Write a professional report: context, analysis, findings, recommendations.',
  },
  texte_professionnel: {
    fr: 'Rédige un texte professionnel prêt à l’emploi (courriel, note, annonce) selon la demande.',
    en: 'Write a ready-to-use professional text (email, memo, announcement) as requested.',
  },
  publication: {
    fr: 'Rédige une publication claire et engageante, adaptée à son support.',
    en: 'Write a clear, engaging publication suited to its medium.',
  },
  presentation: {
    fr: 'Produis un document de présentation structuré en diapositives logiques (texte).',
    en: 'Produce a structured presentation document in logical slides (text).',
  },
  code: {
    fr: 'Écris du code commenté et fonctionnel répondant à la demande, avec les précautions nécessaires.',
    en: 'Write commented, working code fulfilling the request, with necessary precautions.',
  },
  plan: {
    fr: 'Produis un plan ou cahier des charges : objectifs, périmètre, étapes, livrables.',
    en: 'Produce a plan or specification: objectives, scope, steps, deliverables.',
  },
  creatif: {
    fr: 'Crée un contenu créatif original en respectant la demande.',
    en: 'Create original creative content following the request.',
  },
};

function titreDepuis(instruction: string, type: TypeCreation): string {
  const extrait = instruction.trim().slice(0, 70);
  return extrait || type.replace(/_/g, ' ');
}

export function createRoutesCreation(): express.Router {
  const c = express.Router();
  c.use(authRequise);

  /* ── Explorer : recherche sourcée ── */

  c.get('/search', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const liste = await r.donnees!.recherches();
    res.json({ recherches: liste });
  }));

  c.get('/search/:id', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const recherche = await r.donnees!.recherche(req.params.id);
    if (!recherche) {
      erreur404(res);
      return;
    }
    const sources = await r.donnees!.sources(recherche.id);
    res.json({ recherche, sources });
  }));

  c.post(
    '/search',
    limiteParCompte(12, 5 * 60 * 1000),
    asyncRoute(async (req, res) => {
      const r = req as ReqV1;
      const corps = (req.body ?? {}) as Record<string, unknown>;
      const requete = chaine(corps.requete, { min: 3, max: 500 });
      if (requete === undefined || requete === null) {
        invalide(res, { requete: 'invalide' });
        return;
      }
      let projectId: string | null = null;
      if (corps.projectId !== undefined && corps.projectId !== null) {
        if (typeof corps.projectId !== 'string' || !(await r.donnees!.projet(corps.projectId))) {
          erreur404(res);
          return;
        }
        projectId = corps.projectId;
      }

      const connecteur = await choisirConnecteur();
      if (!connecteur) {
        erreur503Stockage(
          res,
          'Recherche indisponible : aucun service de recherche n’est configuré sur cet environnement.',
        );
        return;
      }

      try {
        const resultat = await connecteur.rechercher(requete!, {
          langue: corps.langue === 'en' ? 'en' : 'fr',
        });
        const maintenant = new Date().toISOString();
        const recherche = await r.donnees!.creerRecherche(
          {
            id: nouvelId('rch'),
            projectId,
            requete: requete!,
            synthese: resultat.synthese,
            statut: resultat.sansResultat ? 'sans_resultat' : 'terminee',
            erreur: null,
            cree: maintenant,
          },
          resultat.sources.map((s) => ({
            id: nouvelId('src'),
            rechercheId: '',
            titre: s.titre,
            url: s.url,
            extrait: s.extrait,
            dateSource: null,
          })),
        );
        // Les sources doivent référencer l'id réel de la recherche.
        const sources = await r.donnees!.sources(recherche.id);
        await r.donnees!.enregistrerEvenement({
          id: nouvelId('evt'),
          genre: 'recherche',
          cree: maintenant,
          meta: { sources: resultat.sources.length },
        });
        res.status(201).json({
          recherche,
          sources: sources.length ? sources : lierSources(resultat.sources, recherche.id),
          connecteur: resultat.connecteur,
        });
      } catch (e) {
        if (e instanceof ErreurAi) {
          res.status(e.statut).json({ error: e.message, code: e.code });
          return;
        }
        res.status(502).json({ error: 'Le service de recherche ne répond pas.', code: 'recherche-indisponible' });
      }
    }),
  );

  c.delete('/search/:id', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const ok = await r.donnees!.supprimerRecherche(req.params.id);
    if (!ok) {
      erreur404(res);
      return;
    }
    res.status(204).end();
  }));

  /* ── Studio : créations (jobs + versions) ── */

  c.get('/studio/jobs', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const liste = await r.donnees!.creations();
    res.json({
      jobs: liste.map((j) => ({
        ...j,
        versions: j.versions.map((v) => ({ ...v, contenu: undefined, caracteres: v.contenu.length })),
      })),
    });
  }));

  c.post(
    '/studio/jobs',
    limiteParCompte(12, 10 * 60 * 1000),
    asyncRoute(async (req, res) => {
      const r = req as ReqV1;
      const corps = (req.body ?? {}) as Record<string, unknown>;
      const type = enumere(corps.type, TYPES_CREATION);
      if (!type) {
        invalide(res, { type: 'invalide' });
        return;
      }
      const instruction = chaine(corps.instruction, { min: 3, max: 4000 });
      if (instruction === undefined || instruction === null) {
        invalide(res, { instruction: 'invalide' });
        return;
      }
      let projectId: string | null = null;
      if (corps.projectId !== undefined && corps.projectId !== null) {
        if (typeof corps.projectId !== 'string' || !(await r.donnees!.projet(corps.projectId))) {
          erreur404(res);
          return;
        }
        projectId = corps.projectId;
      }
      const titre = chaine(corps.titre, { max: 120 }) ?? titreDepuis(instruction!, type);

      const creation = await r.donnees!.creerCreation({
        id: nouvelId('job'),
        projectId,
        type,
        titre,
        instruction: instruction!,
        statut: 'en_attente',
        erreur: null,
        versions: [],
        cree: new Date().toISOString(),
        maj: new Date().toISOString(),
      });

      // Génération réelle — courte et synchrone (limite serverless).
      try {
        const projet = projectId ? await r.donnees!.projet(projectId) : null;
        const consigne =
          (corps.langue === 'en' ? INSTRUCTIONS_TYPE[type].en : INSTRUCTIONS_TYPE[type].fr) +
          `\n\nSujet / instruction : ${instruction}` +
          (projet ? `\n\nContexte du projet « ${projet.nom} » : ${projet.objectif || projet.description}` : '');
        const rep = await serviceIa.generer(
          type === 'code' ? 'code' : 'creation',
          {
            messages: [{ role: 'user', content: consigne }],
            system:
              corps.langue === 'en'
                ? 'You are Aura Studio, the creation engine of the Aura workspace. Produce polished, usable deliverables. Never invent sources or facts; mark uncertainties explicitly.'
                : 'Tu es Aura Studio, le moteur de création de l’espace de travail Aura. Produis des livrables soignés et utilisables. N’invente ni sources ni faits ; signale explicitement les incertitudes.',
            maxTokens: 4096,
          },
          { noter: (t) => enregistrerUsage(r.donnees, t) },
        );
        const version: Omit<VersionCreation, 'id'> = {
          numero: 1,
          contenu: rep.texte,
          note: 'Génération initiale',
          cree: new Date().toISOString(),
        };
        const finie = await r.donnees!.ajouterVersion(creation.id, version);
        const maj = await r.donnees!.majCreation(creation.id, {
          statut: 'terminee',
          erreur: null,
        });
        await r.donnees!.enregistrerEvenement({
          id: nouvelId('evt'),
          genre: 'creation',
          cree: new Date().toISOString(),
          meta: { type, caracteres: rep.texte.length },
        });
        res.status(201).json({ job: maj ?? finie ?? creation });
      } catch (e) {
        const erreur = e instanceof ErreurAi ? e.message : 'Le moteur IA est indisponible.';
        const maj = await r.donnees!.majCreation(creation.id, { statut: 'erreur', erreur });
        const statut = e instanceof ErreurAi ? e.statut : 502;
        res.status(statut).json({
          error: erreur,
          code: e instanceof ErreurAi ? e.code : 'modele-indisponible',
          job: maj ?? creation,
        });
      }
    }),
  );

  c.get('/studio/jobs/:id', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const job = await r.donnees!.creation(req.params.id);
    if (!job) {
      erreur404(res);
      return;
    }
    res.json({ job });
  }));

  /** Nouvelle version (révision) d'une création existante. */
  c.post(
    '/studio/jobs/:id/versions',
    limiteParCompte(12, 10 * 60 * 1000),
    asyncRoute(async (req, res) => {
      const r = req as ReqV1;
      const job = await r.donnees!.creation(req.params.id);
      if (!job) {
        erreur404(res);
        return;
      }
      const corps = (req.body ?? {}) as Record<string, unknown>;
      const instruction = chaine(corps.instruction, { max: 2000, defaut: '' }) ?? '';
      const derniere = job.versions[job.versions.length - 1];
      try {
        const rep = await serviceIa.generer(
          job.type === 'code' ? 'code' : 'creation',
          {
            messages: [
              {
                role: 'user',
                content:
                  `Voici une version existante d'un livrable de type « ${job.type} » :\n\n` +
                  `${(derniere?.contenu ?? '').slice(0, 6000)}\n\n` +
                  (instruction
                    ? `Applique la révision demandée : ${instruction}`
                    : 'Améliore et complète cette version.'),
              },
            ],
            system:
              'Tu es Aura Studio. Produis la version révisée complète du livrable, prête à l’emploi. N’invente ni sources ni faits.',
            maxTokens: 4096,
          },
          { noter: (t) => enregistrerUsage(r.donnees, t) },
        );
        const version: Omit<VersionCreation, 'id'> = {
          numero: (derniere?.numero ?? 0) + 1,
          contenu: rep.texte,
          note: instruction ? `Révision : ${instruction.slice(0, 120)}` : 'Révision',
          cree: new Date().toISOString(),
        };
        const maj = await r.donnees!.ajouterVersion(job.id, version);
        res.status(201).json({ job: maj ?? job });
      } catch (e) {
        if (e instanceof ErreurAi) {
          res.status(e.statut).json({ error: e.message, code: e.code });
          return;
        }
        res.status(502).json({ error: 'Le moteur IA est indisponible.', code: 'modele-indisponible' });
      }
    }),
  );

  /** Export d'un livrable (dernière version) en Markdown téléchargeable. */
  c.get('/studio/artifacts/:id', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const job = await r.donnees!.creation(req.params.id);
    if (!job) {
      erreur404(res);
      return;
    }
    const version = job.versions[job.versions.length - 1];
    if (!version) {
      res.status(404).json({ error: 'Aucune version disponible pour cette création.', code: 'sans-version' });
      return;
    }
    const nomFichier = job.titre
      .toLowerCase()
      .replace(/[^a-z0-9à-ÿ]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'creation';
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nomFichier}.md"`);
    res.send(`# ${job.titre}\n\n> ${job.type} — version ${version.numero} (${version.cree})\n\n${version.contenu}\n`);
  }));

  c.delete('/studio/jobs/:id', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const ok = await r.donnees!.supprimerCreation(req.params.id);
    if (!ok) {
      erreur404(res);
      return;
    }
    res.status(204).end();
  }));

  return c;
}

function lierSources(
  sources: Array<{ titre: string; url: string; extrait: string }>,
  rechercheId: string,
): SourceRecherche[] {
  return sources.map((s) => ({
    id: nouvelId('src'),
    rechercheId,
    titre: s.titre,
    url: s.url,
    extrait: s.extrait,
    dateSource: null,
  }));
}
