/**
 * API v1 — compte, préférences, capacités, conversations (avec streaming).
 *
 * Toutes les routes privées exigent une session et vérifient la propriété
 * des ressources via les entrepôts (périmètre utilisateur).
 */
import express, { type Response } from 'express';
import {
  authRequise,
  asyncRoute,
  attacherCompteV1,
  bool,
  chaine,
  enumere,
  erreur404,
  invalide,
  limiteParCompte,
  versPublicV1,
  type ReqV1,
} from './middlewares';
import {
  profilParDefaut,
  preferencesParDefaut,
  nouvelId,
} from '../db/entrepots';
import type { Message, PreferencesUtilisateur, ProfilContextuel, StatutMessage } from '../db/types';
import { construireContexte, versMessagesModele } from '../services/contexte';
import * as serviceIa from '../ai/service';
import { ErreurAi } from '../ai/errors';
import { enregistrerUsage, consommationParFournisseur } from '../ai/usage';
import type { MessageAi } from '../ai/types';
import { createRoutesTravail } from './routesTravail';
import { createRoutesCreation } from './routesCreation';
import {
  COOKIE_SESSION,
  empreinteJeton,
  lireCookie,
  serialiserCookie,
  verifierMotDePasse,
} from '../accounts';

const LIMITE_CONTENU = 8000;

function messagePublic(m: Message) {
  return {
    id: m.id,
    conversationId: m.conversationId,
    role: m.role,
    contenu: m.contenu,
    statut: m.statut,
    cree: m.cree,
    meta: m.meta,
  };
}

export function createApiV1(): express.Router {
  const v1 = express.Router();
  v1.use(express.json({ limit: '64kb' }));
  v1.use(attacherCompteV1);

  /* ── Compte & profil ── */

  v1.get('/me', authRequise, (req, res) => {
    res.json({ compte: versPublicV1((req as ReqV1).compte!) });
  });

  v1.patch('/me', authRequise, asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const corps = (req.body ?? {}) as Record<string, unknown>;
    const champs: Record<string, string> = {};
    const compte = r.compte!;

    const nom = chaine(corps.nom, { max: 80 });
    if (corps.nom !== undefined && nom === undefined) champs.nom = 'invalide';
    if (nom !== undefined && nom !== null) compte.nom = nom;

    if (corps.profil !== undefined) {
      const p = (corps.profil ?? {}) as Record<string, unknown>;
      const profil: ProfilContextuel = { ...profilParDefaut(), ...compte.profil };
      const pays = chaine(p.pays, { max: 60, nullable: true });
      if (p.pays !== undefined && pays === undefined) champs.pays = 'invalide';
      if (pays !== undefined) profil.pays = pays;
      const region = chaine(p.region, { max: 80, nullable: true });
      if (p.region !== undefined && region === undefined) champs.region = 'invalide';
      if (region !== undefined) profil.region = region;
      const langue = enumere(p.languePrincipale, ['fr', 'en'] as const);
      if (p.languePrincipale !== undefined && !langue) champs.languePrincipale = 'invalide';
      if (langue) profil.languePrincipale = langue;
      if (Array.isArray(p.languesSecondaires)) {
        profil.languesSecondaires = p.languesSecondaires
          .filter((l): l is string => typeof l === 'string')
          .map((l) => l.trim().slice(0, 30))
          .slice(0, 6);
      }
      const devise = chaine(p.devise, { max: 10, nullable: true });
      if (p.devise !== undefined && devise === undefined) champs.devise = 'invalide';
      if (devise !== undefined) profil.devise = devise;
      const fuseau = chaine(p.fuseau, { max: 60, nullable: true });
      if (p.fuseau !== undefined && fuseau === undefined) champs.fuseau = 'invalide';
      if (fuseau !== undefined) profil.fuseau = fuseau;
      const unites = enumere(p.unites, ['metriques', 'imperiales'] as const);
      if (p.unites !== undefined && !unites) champs.unites = 'invalide';
      if (unites) profil.unites = unites;
      const domaine = chaine(p.domaine, { max: 120, nullable: true });
      if (p.domaine !== undefined && domaine === undefined) champs.domaine = 'invalide';
      if (domaine !== undefined) profil.domaine = domaine;
      compte.profil = profil;
    }

    if (Object.keys(champs).length) {
      invalide(res, champs);
      return;
    }
    await r.comptes!.enregistrer(compte);
    res.json({ compte: versPublicV1(compte) });
  }));

  v1.get('/preferences', authRequise, (req, res) => {
    res.json({ preferences: (req as ReqV1).compte!.preferences });
  });

  v1.patch('/preferences', authRequise, asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const corps = (req.body ?? {}) as Record<string, unknown>;
    const champs: Record<string, string> = {};
    const prefs: PreferencesUtilisateur = { ...preferencesParDefaut(), ...r.compte!.preferences };

    const ton = enumere(corps.tonReponse, ['concis', 'detaille', 'pedagogique'] as const);
    if (corps.tonReponse !== undefined && !ton) champs.tonReponse = 'invalide';
    if (ton) prefs.tonReponse = ton;
    const memoire = bool(corps.utiliserMemoire);
    if (corps.utiliserMemoire !== undefined && memoire === undefined) champs.utiliserMemoire = 'invalide';
    if (memoire !== undefined) prefs.utiliserMemoire = memoire;
    const langue = enumere(corps.langueReponse, ['auto', 'fr', 'en'] as const);
    if (corps.langueReponse !== undefined && !langue) champs.langueReponse = 'invalide';
    if (langue) prefs.langueReponse = langue;

    if (Object.keys(champs).length) {
      invalide(res, champs);
      return;
    }
    r.compte!.preferences = prefs;
    await r.comptes!.enregistrer(r.compte!);
    res.json({ preferences: prefs });
  }));

  /* ── Capacités réelles (§21) : l'interface n'affiche que ce qui marche,
        sans nom de fournisseur ni de modèle ── */

  v1.get('/capabilities', asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const comptesActifs = r.comptes!.mode !== 'indisponible';
    const etatIa = await serviceIa.etatIa();
    res.json({
      comptes: comptesActifs,
      persistance: {
        ok: comptesActifs,
        mode: r.comptes!.mode,
        ...(comptesActifs ? {} : { raison: r.comptes!.raison }),
      },
      assistant: {
        ok: etatIa.ok,
        streaming: etatIa.streaming,
        sortieStructuree: etatIa.sortieStructuree,
        ...(etatIa.raison ? { raison: etatIa.raison } : {}),
      },
      recherche: {
        ok: etatIa.sources,
        ...(etatIa.sources ? {} : { raison: 'Aucun moteur de recherche configuré.' }),
      },
      studio: { ok: etatIa.ok },
      images: { ok: false, raison: "Génération d'images non disponible sur cet environnement." },
      fichiers: {
        ok: false,
        raison: 'Stockage objet non configuré : les pièces jointes restent désactivées.',
      },
    });
  }));

  /* ── Tableau de bord technique interne : consommation IA du compte
        (par fournisseur, sans secret ni contenu utilisateur) ── */

  v1.get('/ai/usage', authRequise, asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const consommation = await consommationParFournisseur(r.donnees!);
    res.json({ consommation });
  }));

  /* ── Suppression de compte (§16) — confirmation par mot de passe ── */

  v1.delete(
    '/me',
    authRequise,
    limiteParCompte(5, 15 * 60 * 1000),
    asyncRoute(async (req, res) => {
      const r = req as ReqV1;
      const corps = (req.body ?? {}) as Record<string, unknown>;
      const password = typeof corps.password === 'string' ? corps.password : '';
      if (!password) {
        invalide(res, { password: 'invalide' });
        return;
      }
      const valide = await verifierMotDePasse(password, r.compte!.hash, r.compte!.sel);
      if (!valide) {
        res.status(401).json({ error: 'Mot de passe incorrect.', code: 'identifiants' });
        return;
      }
      // Suppression : données, sessions, compte, index email.
      await r.donnees!.supprimerTout();
      await r.comptes!.supprimerCompte(r.compte!.id);
      const jeton = lireCookie(req, COOKIE_SESSION);
      if (jeton) await r.comptes!.supprimerSession(empreinteJeton(jeton));
      res.setHeader('Set-Cookie', serialiserCookie(COOKIE_SESSION, '', { maxAge: 0 }));
      res.status(204).end();
    }),
  );

  /* ── Conversations ── */

  v1.get('/conversations', authRequise, asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const q = (req.query.q as string | undefined)?.trim().toLowerCase();
    const projectId = req.query.projectId as string | undefined;
    let liste = await r.donnees!.conversations({ inclureArchivees: req.query.archivees === '1' });
    if (projectId) liste = liste.filter((c) => c.projectId === projectId);
    if (q) liste = liste.filter((c) => c.titre.toLowerCase().includes(q));
    res.json({ conversations: liste });
  }));

  v1.post('/conversations', authRequise, asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const corps = (req.body ?? {}) as Record<string, unknown>;
    const titre = chaine(corps.titre, { max: 120, defaut: 'Nouvelle conversation' });
    if (titre === undefined) {
      invalide(res, { titre: 'invalide' });
      return;
    }
    let projectId: string | null = null;
    if (corps.projectId !== undefined && corps.projectId !== null) {
      if (typeof corps.projectId !== 'string') {
        invalide(res, { projectId: 'invalide' });
        return;
      }
      const projet = await r.donnees!.projet(corps.projectId);
      if (!projet) {
        erreur404(res);
        return;
      }
      projectId = projet.id;
    }
    const conv = await r.donnees!.creerConversation({
      id: nouvelId('conv'),
      titre: titre || 'Nouvelle conversation',
      projectId,
      archive: false,
      cree: new Date().toISOString(),
      maj: new Date().toISOString(),
    });
    res.status(201).json({ conversation: conv });
  }));

  v1.get('/conversations/:id', authRequise, asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const conv = await r.donnees!.conversation(req.params.id);
    if (!conv) {
      erreur404(res);
      return;
    }
    const messages = await r.donnees!.messages(conv.id);
    res.json({ conversation: conv, messages: messages.map(messagePublic) });
  }));

  v1.patch('/conversations/:id', authRequise, asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const corps = (req.body ?? {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    const titre = chaine(corps.titre, { max: 120 });
    if (corps.titre !== undefined && (titre === undefined || titre === '')) {
      invalide(res, { titre: 'invalide' });
      return;
    }
    if (titre) patch.titre = titre;
    const archive = bool(corps.archive);
    if (corps.archive !== undefined && archive === undefined) {
      invalide(res, { archive: 'invalide' });
      return;
    }
    if (archive !== undefined) patch.archive = archive;
    if (corps.projectId !== undefined) {
      if (corps.projectId === null) {
        patch.projectId = null;
      } else if (typeof corps.projectId === 'string' && (await r.donnees!.projet(corps.projectId))) {
        patch.projectId = corps.projectId;
      } else {
        erreur404(res);
        return;
      }
    }
    const maj = await r.donnees!.majConversation(req.params.id, patch);
    if (!maj) {
      erreur404(res);
      return;
    }
    res.json({ conversation: maj });
  }));

  v1.delete('/conversations/:id', authRequise, asyncRoute(async (req, res) => {
    const r = req as ReqV1;
    const ok = await r.donnees!.supprimerConversation(req.params.id);
    if (!ok) {
      erreur404(res);
      return;
    }
    res.status(204).end();
  }));

  /* ── Message + réponse (streaming SSE optionnel) ── */

  v1.post(
    '/conversations/:id/messages',
    authRequise,
    limiteParCompte(40, 5 * 60 * 1000),
    asyncRoute(async (req, res) => {
      const r = req as ReqV1;
      const conv = await r.donnees!.conversation(req.params.id);
      if (!conv) {
        erreur404(res);
        return;
      }
      const corps = (req.body ?? {}) as Record<string, unknown>;
      const estRegeneration = corps.regenerer === true;
      const contenu = estRegeneration ? '' : chaine(corps.contenu, { min: 1, max: LIMITE_CONTENU });
      if (!estRegeneration && (contenu === undefined || contenu === null)) {
        invalide(res, { contenu: 'invalide' });
        return;
      }
      const veutStream =
        corps.stream === true ||
        (req.headers.accept ?? '').includes('text/event-stream');

      const etatIa = await serviceIa.etatIa();
      if (!etatIa.ok) {
        res.status(503).json({
          error:
            etatIa.raison ??
            'Assistant indisponible : aucun moteur IA n’est configuré sur cet environnement.',
          code: 'chat-indisponible',
        });
        return;
      }

      const journal = {
        noter: (t: Parameters<typeof enregistrerUsage>[1]) => enregistrerUsage(r.donnees, t),
      };

      const maintenant = new Date().toISOString();
      let messageUser!: Message;

      if (estRegeneration) {
        // Régénération : reprendre le dernier message utilisateur et
        // remplacer la réponse — aucun nouveau message utilisateur.
        const historiqueExistant = await r.donnees!.messages(conv.id, { limite: 40 });
        const dernierUser = [...historiqueExistant].reverse().find((m) => m.role === 'user');
        if (!dernierUser) {
          invalide(res, { conversation: 'vide' });
          return;
        }
        messageUser = dernierUser;
        for (const m of historiqueExistant) {
          if (m.role === 'assistant') await r.donnees!.supprimerMessage(conv.id, m.id);
        }
      } else {
        messageUser = await r.donnees!.ajouterMessage({
          id: nouvelId('msg'),
          conversationId: conv.id,
          role: 'user',
          contenu: contenu!,
          statut: 'envoye',
          cree: maintenant,
          meta: null,
        });

        // Titre auto à partir du premier message.
        if (conv.titre === 'Nouvelle conversation') {
          await r.donnees!.majConversation(conv.id, {
            titre: contenu!.slice(0, 80),
          });
        }
      }

      // Contexte : conversation + projet + mémoires autorisées (sélection).
      const projet = conv.projectId ? await r.donnees!.projet(conv.projectId) : null;
      const memoires = r.compte!.preferences.utiliserMemoire
        ? await r.donnees!.memoires({ actives: true })
        : [];
      const langue = r.compte!.preferences.langueReponse === 'auto'
        ? (req.body as { langue?: string })?.langue === 'en'
          ? 'en'
          : 'fr'
        : r.compte!.preferences.langueReponse;
      const ctx = construireContexte({
        compte: r.compte!,
        langue,
        projet,
        memoires: [...memoires].sort((a, b) => (a.cree < b.cree ? 1 : -1)),
      });

      const historique = await r.donnees!.messages(conv.id, { limite: 40 });
      const messagesModele: MessageAi[] = versMessagesModele(historique);

      const enregistrerReponse = async (
        texte: string,
        statut: StatutMessage,
        erreur?: string,
      ): Promise<Message> =>
        r.donnees!.ajouterMessage({
          id: nouvelId('msg'),
          conversationId: conv.id,
          role: 'assistant',
          contenu: texte,
          statut,
          cree: new Date().toISOString(),
          meta: {
            ...(erreur ? { erreur } : {}),
            memoiresUtilisees: ctx.memoiresUtilisees,
          },
        });

      // ── Streaming SSE ──
      if (veutStream) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        });
        const envoyer = (evenement: string, donnees: unknown) => {
          res.write(`event: ${evenement}\ndata: ${JSON.stringify(donnees)}\n\n`);
        };

        const controle = new AbortController();
        req.on('close', () => controle.abort());

        try {
          const rep = await serviceIa.genererEnStream(
            'conversation',
            { messages: messagesModele, system: ctx.system, langue },
            (morceau) => envoyer('chunk', { texte: morceau }),
            controle.signal,
            journal,
          );
          const message = await enregistrerReponse(rep.texte, 'genere');
          envoyer('done', {
            message: messagePublic(messageUser),
            reponse: messagePublic(message),
          });
          await r.donnees!.enregistrerEvenement({
            id: nouvelId('evt'),
            genre: 'chat',
            cree: new Date().toISOString(),
            meta: { stream: true, caracteres: rep.texte.length },
          });
        } catch (e) {
          const estAnnulation = e instanceof Error && e.name === 'AbortError';
          if (estAnnulation) {
            const message = await enregistrerReponse('', 'interrompu');
            envoyer('done', {
              message: messagePublic(messageUser),
              reponse: messagePublic(message),
              interrompu: true,
            });
          } else {
            const err =
              e instanceof ErreurAi
                ? { error: e.message, code: e.code }
                : { error: 'Le modèle ne répond pas.', code: 'modele-indisponible' };
            await enregistrerReponse('', 'erreur', err.error);
            envoyer('error', err);
          }
        }
        res.end();
        return;
      }

      // ── Réponse en une passe ──
      try {
        const rep = await serviceIa.generer(
          'conversation',
          { messages: messagesModele, system: ctx.system, langue },
          journal,
        );
        const message = await enregistrerReponse(rep.texte, 'genere');
        await r.donnees!.enregistrerEvenement({
          id: nouvelId('evt'),
          genre: 'chat',
          cree: new Date().toISOString(),
          meta: { stream: false, caracteres: rep.texte.length },
        });
        res.json({
          message: messagePublic(messageUser),
          reponse: messagePublic(message),
        });
      } catch (e) {
        if (e instanceof ErreurAi) {
          await enregistrerReponse('', 'erreur', e.message);
          res.status(e.statut).json({ error: e.message, code: e.code });
          return;
        }
        await enregistrerReponse('', 'erreur', 'Le modèle ne répond pas.');
        res.status(502).json({ error: 'Le modèle ne répond pas.', code: 'modele-indisponible' });
      }
    }),
  );

  // Modules de travail et de création (projets, missions, mémoire, recherche, studio).
  v1.use(createRoutesTravail());
  v1.use(createRoutesCreation());

  return v1;
}
