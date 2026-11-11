/**
 * Client API du workspace — toutes les pages passent par ici.
 *
 * - `apiAppel` : fetch JSON avec cookies, contrat d'erreur uniforme.
 * - Services par domaine : en mode simulation, délégation vers le
 *   stockage local (contrats identiques, données étiquetées simulées) ;
 *   sinon, appels réels à /api/v1.
 */
import { simulationActivee } from '../app/simulation';
import * as local from './local';
import type {
  AdminDetail,
  AdminJournalEntree,
  AdminSession,
  AdminStatistiques,
  AdminUtilisateur,
  Capabilities,
  CompteV1,
  Conversation,
  Creation,
  Memoire,
  MessageChat,
  ModeChat,
  Mission,
  PieceJointeChat,
  PrioriteMission,
  SessionActive,
  Projet,
  PropositionMission,
  Recherche,
  ReferenceCitee,
  SavoirDomaine,
  SavoirEtat,
  SavoirJournalEntreeAdmin,
  SavoirNiveau,
  SavoirPassageAdmin,
  SavoirRessource,
  SavoirSource,
  SavoirStatut,
  SourceRecherche,
  StatutMission,
  TypeCreation,
  TypeMemoire,
} from './types';

export type ReponseApi<T> =
  | { ok: true; donnees: T }
  | { ok: false; erreur: string; code?: string; statut: number };

function succes<T>(donnees: T): ReponseApi<T> {
  return { ok: true, donnees };
}

function echec(erreur: string, code?: string, statut = 0): ReponseApi<never> {
  return { ok: false, erreur, code, statut };
}

export async function apiAppel<T>(
  route: string,
  opts: { methode?: string; corps?: unknown } = {},
): Promise<ReponseApi<T>> {
  try {
    const r = await fetch(`/api/v1${route}`, {
      method: opts.methode ?? 'GET',
      credentials: 'same-origin',
      headers: opts.corps !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: opts.corps !== undefined ? JSON.stringify(opts.corps) : undefined,
    });
    if (r.status === 204) return succes(undefined as T);
    const d = (await r.json().catch(() => ({}))) as T & { error?: string; code?: string };
    if (r.ok) return succes(d);
    return echec(d.error ?? 'Le service ne répond pas.', d.code, r.status);
  } catch {
    return echec('Le service ne répond pas.', 'reseau');
  }
}

/* ───────────────────────── Capacités ───────────────────────── */

export async function lireCapabilities(): Promise<ReponseApi<Capabilities>> {
  if (simulationActivee()) return succes(local.capabilities());
  return apiAppel<Capabilities>('/capabilities');
}

/* ───────────────────────── Conversations ───────────────────────── */

export async function listerConversations(opts: { q?: string; projectId?: string } = {}): Promise<
  ReponseApi<{ conversations: Conversation[] }>
> {
  if (simulationActivee()) return succes({ conversations: local.listerConversations(opts) });
  const params = new URLSearchParams();
  if (opts.q) params.set('q', opts.q);
  if (opts.projectId) params.set('projectId', opts.projectId);
  const qs = params.toString();
  return apiAppel(`/conversations${qs ? '?' + qs : ''}`);
}

export async function creerConversation(corps: { titre?: string; projectId?: string | null } = {}): Promise<
  ReponseApi<{ conversation: Conversation }>
> {
  if (simulationActivee()) return succes({ conversation: local.creerConversation(corps) });
  return apiAppel('/conversations', { methode: 'POST', corps });
}

export async function ouvrirConversation(id: string): Promise<
  ReponseApi<{ conversation: Conversation; messages: MessageChat[] }>
> {
  if (simulationActivee()) return local.ouvrirConversation(id);
  return apiAppel(`/conversations/${id}`);
}

export async function majConversation(
  id: string,
  patch: { titre?: string; archive?: boolean; projectId?: string | null },
): Promise<ReponseApi<{ conversation: Conversation }>> {
  if (simulationActivee()) return succes({ conversation: local.majConversation(id, patch) });
  return apiAppel(`/conversations/${id}`, { methode: 'PATCH', corps: patch });
}

export async function supprimerConversation(id: string): Promise<ReponseApi<void>> {
  if (simulationActivee()) {
    local.supprimerConversation(id);
    return succes(undefined);
  }
  return apiAppel(`/conversations/${id}`, { methode: 'DELETE' });
}

/**
 * Envoi d'un message avec réponse SSE en streaming.
 * `onChunk` reçoit les morceaux ; renvoie la réponse finale.
 * `regenerer: true` régénère la dernière réponse sans créer de message
 * utilisateur (le serveur reprend le dernier message de l'utilisateur).
 */
export async function envoyerMessage(
  conversationId: string,
  contenu: string,
  opts: {
    langue?: 'fr' | 'en';
    onChunk?: (texte: string) => void;
    /** Sources annoncées avant la fin de la génération (uniquement celles réellement envoyées). */
    onSources?: (references: ReferenceCitee[], avertissements: string[]) => void;
    signal?: AbortSignal;
    stream?: boolean;
    regenerer?: boolean;
    piecesJointes?: PieceJointeChat[];
    mode?: ModeChat;
  } = {},
): Promise<
  ReponseApi<{ message: MessageChat; reponse: MessageChat; interrompu?: boolean }>
> {
  if (simulationActivee()) return local.envoyerMessage(conversationId, contenu, opts);

  const veutStream = opts.stream !== false && Boolean(opts.onChunk);
  try {
    const r = await fetch(`/api/v1/conversations/${conversationId}/messages`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({
        contenu: opts.regenerer ? undefined : contenu,
        regenerer: opts.regenerer === true,
        langue: opts.langue,
        stream: veutStream,
        ...(opts.piecesJointes?.length ? { piecesJointes: opts.piecesJointes } : {}),
        ...(opts.mode && opts.mode !== 'conversation' ? { mode: opts.mode } : {}),
      }),
      signal: opts.signal,
    });

    if (!veutStream || !(r.headers.get('content-type') ?? '').includes('text/event-stream')) {
      const d = (await r.json().catch(() => ({}))) as {
        message?: MessageChat;
        reponse?: MessageChat;
        references?: ReferenceCitee[];
        error?: string;
        code?: string;
      };
      if (r.ok && d.reponse) {
        if (d.references?.length && !d.reponse.meta?.references) {
          d.reponse.meta = { ...(d.reponse.meta ?? {}), references: d.references };
        }
        return succes({ message: d.message!, reponse: d.reponse });
      }
      return echec(d.error ?? 'Le service ne répond pas.', d.code, r.status);
    }

    // Parsing SSE.
    const lecteur = r.body!.getReader();
    const decode = new TextDecoder();
    let tampon = '';
    let evenement = '';
    const etat: {
      resultat: { message: MessageChat; reponse: MessageChat; interrompu?: boolean } | null;
      erreur: { message: string; code?: string } | null;
    } = { resultat: null, erreur: null };

    const traiter = (nom: string, donnees: string) => {
      try {
        const j = JSON.parse(donnees) as Record<string, unknown>;
        if (nom === 'chunk') opts.onChunk?.(String((j as { texte?: string }).texte ?? ''));
        if (nom === 'sources') {
          opts.onSources?.(
            (j.references as ReferenceCitee[] | undefined) ?? [],
            (j.avertissements as string[] | undefined) ?? [],
          );
        }
        if (nom === 'done') etat.resultat = j as unknown as typeof etat.resultat;
        if (nom === 'error') etat.erreur = { message: String(j.error ?? 'Erreur de génération.'), code: j.code as string | undefined };
      } catch {
        /* trame partielle */
      }
    };

    for (;;) {
      const { done, value } = await lecteur.read();
      if (done) break;
      tampon += decode.decode(value, { stream: true });
      const lignes = tampon.split('\n');
      tampon = lignes.pop() ?? '';
      for (const ligne of lignes) {
        if (ligne.startsWith('event:')) evenement = ligne.slice(6).trim();
        else if (ligne.startsWith('data:')) traiter(evenement, ligne.slice(5).trim());
      }
    }

    if (etat.resultat) return succes(etat.resultat);
    if (etat.erreur) return echec(etat.erreur.message, etat.erreur.code, 502);
    return echec('Réponse interrompue.', 'interrompu');
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return echec('Génération interrompue.', 'annule');
    }
    return echec('Le service ne répond pas.', 'reseau');
  }
}

/* ───────────────────────── Projets ───────────────────────── */

export async function listerProjets(opts: { archives?: boolean } = {}): Promise<
  ReponseApi<{ projets: Projet[] }>
> {
  if (simulationActivee()) return succes({ projets: local.listerProjets(opts) });
  return apiAppel(`/projets${opts.archives ? '?archives=1' : ''}`);
}

export async function creerProjet(corps: {
  nom: string;
  description?: string;
  objectif?: string;
  categorie?: string;
  instructions?: string;
}): Promise<ReponseApi<{ projet: Projet }>> {
  if (simulationActivee()) return succes({ projet: local.creerProjet(corps) });
  return apiAppel('/projets', { methode: 'POST', corps });
}

export async function ouvrirProjet(id: string): Promise<
  ReponseApi<{
    projet: Projet;
    conversations: Conversation[];
    missions: Mission[];
    memoires: Memoire[];
    creations: Creation[];
    recherches: Recherche[];
  }>
> {
  if (simulationActivee()) return local.ouvrirProjet(id);
  return apiAppel(`/projets/${id}`);
}

export async function majProjet(
  id: string,
  patch: Partial<Pick<Projet, 'nom' | 'description' | 'objectif' | 'categorie' | 'instructions' | 'statut'>>,
): Promise<ReponseApi<{ projet: Projet }>> {
  if (simulationActivee()) return succes({ projet: local.majProjet(id, patch) });
  return apiAppel(`/projets/${id}`, { methode: 'PATCH', corps: patch });
}

export async function supprimerProjet(id: string): Promise<ReponseApi<void>> {
  if (simulationActivee()) {
    local.supprimerProjet(id);
    return succes(undefined);
  }
  return apiAppel(`/projets/${id}`, { methode: 'DELETE' });
}

/* ───────────────────────── Missions ───────────────────────── */

export async function listerMissions(opts: { projectId?: string | null; statut?: string } = {}): Promise<
  ReponseApi<{ missions: Mission[] }>
> {
  if (simulationActivee()) return succes({ missions: local.listerMissions(opts) });
  const params = new URLSearchParams();
  if (opts.projectId !== undefined) params.set('projectId', opts.projectId === null ? 'null' : opts.projectId);
  if (opts.statut) params.set('statut', opts.statut);
  const qs = params.toString();
  return apiAppel(`/missions${qs ? '?' + qs : ''}`);
}

export async function creerMission(corps: {
  titre: string;
  description?: string;
  priorite?: PrioriteMission;
  statut?: StatutMission;
  echeance?: string | null;
  projectId?: string | null;
  sousTaches?: string[];
  notes?: string;
}): Promise<ReponseApi<{ mission: Mission }>> {
  if (simulationActivee()) return succes({ mission: local.creerMission(corps) });
  return apiAppel('/missions', { methode: 'POST', corps });
}

export async function creerMissions(
  missions: Array<Omit<Partial<Mission>, 'sousTaches'> & { titre: string; sousTaches?: string[] }>,
  projectId?: string | null,
): Promise<ReponseApi<{ missions: Mission[] }>> {
  if (simulationActivee()) {
    const creees = missions.map((m) => local.creerMission({ ...m, projectId: m.projectId ?? projectId ?? null }));
    return succes({ missions: creees });
  }
  return apiAppel('/missions/batch', { methode: 'POST', corps: { missions, projectId: projectId ?? null } });
}

export async function majMission(
  id: string,
  patch: Partial<Mission>,
): Promise<ReponseApi<{ mission: Mission }>> {
  if (simulationActivee()) return succes({ mission: local.majMission(id, patch) });
  return apiAppel(`/missions/${id}`, { methode: 'PATCH', corps: patch });
}

export async function supprimerMission(id: string): Promise<ReponseApi<void>> {
  if (simulationActivee()) {
    local.supprimerMission(id);
    return succes(undefined);
  }
  return apiAppel(`/missions/${id}`, { methode: 'DELETE' });
}

export async function aideMissions(objectif: string, projectId?: string | null): Promise<
  ReponseApi<{ proposition: PropositionMission[]; note: string }>
> {
  if (simulationActivee()) return local.aideMissions(objectif);
  return apiAppel('/missions/aide', {
    methode: 'POST',
    corps: { objectif, projectId: projectId ?? null },
  });
}

/* ───────────────────────── Mémoire ───────────────────────── */

export async function listerMemoires(opts: { actives?: boolean; projectId?: string | null } = {}): Promise<
  ReponseApi<{ memoires: Memoire[] }>
> {
  if (simulationActivee()) return succes({ memoires: local.listerMemoires(opts) });
  const params = new URLSearchParams();
  if (opts.actives) params.set('actives', '1');
  if (opts.projectId !== undefined) params.set('projectId', opts.projectId === null ? 'null' : opts.projectId);
  const qs = params.toString();
  return apiAppel(`/memoires${qs ? '?' + qs : ''}`);
}

export async function creerMemoire(corps: {
  contenu: string;
  type?: TypeMemoire;
  projectId?: string | null;
}): Promise<ReponseApi<{ memoire: Memoire }>> {
  if (simulationActivee()) return succes({ memoire: local.creerMemoire(corps) });
  return apiAppel('/memoires', { methode: 'POST', corps });
}

export async function majMemoire(
  id: string,
  patch: { contenu?: string; type?: TypeMemoire; actif?: boolean },
): Promise<ReponseApi<{ memoire: Memoire }>> {
  if (simulationActivee()) return succes({ memoire: local.majMemoire(id, patch) });
  return apiAppel(`/memoires/${id}`, { methode: 'PATCH', corps: patch });
}

export async function supprimerMemoire(id: string): Promise<ReponseApi<void>> {
  if (simulationActivee()) {
    local.supprimerMemoire(id);
    return succes(undefined);
  }
  return apiAppel(`/memoires/${id}`, { methode: 'DELETE' });
}

export async function viderMemoires(): Promise<ReponseApi<{ supprimees: number }>> {
  if (simulationActivee()) return succes({ supprimees: local.viderMemoires() });
  return apiAppel('/memoires', { methode: 'DELETE' });
}

/* ───────────────────────── Recherche (Explorer) ───────────────────────── */

export async function listerRecherches(): Promise<ReponseApi<{ recherches: Recherche[] }>> {
  if (simulationActivee()) return succes({ recherches: local.listerRecherches() });
  return apiAppel('/search');
}

export async function ouvrirRecherche(id: string): Promise<
  ReponseApi<{ recherche: Recherche; sources: SourceRecherche[] }>
> {
  if (simulationActivee()) return local.ouvrirRecherche(id);
  return apiAppel(`/search/${id}`);
}

export async function lancerRecherche(corps: {
  requete: string;
  projectId?: string | null;
  langue?: 'fr' | 'en';
}): Promise<ReponseApi<{ recherche: Recherche; sources: SourceRecherche[]; connecteur: string }>> {
  if (simulationActivee()) return local.lancerRecherche(corps);
  return apiAppel('/search', { methode: 'POST', corps });
}

export async function supprimerRecherche(id: string): Promise<ReponseApi<void>> {
  if (simulationActivee()) {
    local.supprimerRecherche(id);
    return succes(undefined);
  }
  return apiAppel(`/search/${id}`, { methode: 'DELETE' });
}

/* ───────────────────────── Studio ───────────────────────── */

export async function listerCreations(): Promise<ReponseApi<{ jobs: Creation[] }>> {
  if (simulationActivee()) return succes({ jobs: local.listerCreations() });
  return apiAppel('/studio/jobs');
}

export async function creerCreation(corps: {
  type: TypeCreation;
  instruction: string;
  titre?: string;
  projectId?: string | null;
  langue?: 'fr' | 'en';
}): Promise<ReponseApi<{ job: Creation }>> {
  if (simulationActivee()) return succes({ job: local.creerCreation(corps) });
  return apiAppel('/studio/jobs', { methode: 'POST', corps });
}

export async function ouvrirCreation(id: string): Promise<ReponseApi<{ job: Creation }>> {
  if (simulationActivee()) return local.ouvrirCreation(id);
  return apiAppel(`/studio/jobs/${id}`);
}

export async function reviserCreation(
  id: string,
  instruction: string,
): Promise<ReponseApi<{ job: Creation }>> {
  if (simulationActivee()) return succes({ job: local.reviserCreation(id, instruction) });
  return apiAppel(`/studio/jobs/${id}/versions`, { methode: 'POST', corps: { instruction } });
}

export async function supprimerCreation(id: string): Promise<ReponseApi<void>> {
  if (simulationActivee()) {
    local.supprimerCreation(id);
    return succes(undefined);
  }
  return apiAppel(`/studio/jobs/${id}`, { methode: 'DELETE' });
}

/**
 * Exports d'un livrable. `version` cible une version précise ; sans elle, le
 * serveur renvoie la dernière. Markdown, Word et PDF sont produits côté
 * serveur — le fichier téléchargé correspond exactement à ce qui est affiché.
 */
export type FormatExport = 'md' | 'docx' | 'pdf' | 'pptx' | 'xlsx' | 'csv' | 'txt' | 'html';

export function urlExportCreationFormat(
  id: string,
  format: FormatExport,
  version?: number | null,
): string {
  const suffixe = format === 'md' ? '' : `/${format}`;
  const requete = version ? `?version=${encodeURIComponent(String(version))}` : '';
  return `/api/v1/studio/artifacts/${encodeURIComponent(id)}${suffixe}${requete}`;
}

export function urlExportCreation(id: string, version?: number | null): string {
  return urlExportCreationFormat(id, 'md', version);
}

export function urlExportCreationDocx(id: string, version?: number | null): string {
  return urlExportCreationFormat(id, 'docx', version);
}

export function urlExportCreationPdf(id: string, version?: number | null): string {
  return urlExportCreationFormat(id, 'pdf', version);
}

/* ───────────────────────── Compte & préférences ───────────────────────── */

export async function lireCompte(): Promise<ReponseApi<{ compte: CompteV1 }>> {
  if (simulationActivee()) {
    const c = local.compteSimule();
    return c ? succes({ compte: c }) : echec('non connecté', 'anonyme', 401);
  }
  return apiAppel('/me');
}

export async function majCompte(corps: {
  nom?: string;
  profil?: Partial<CompteV1['profil']>;
}): Promise<ReponseApi<{ compte: CompteV1 }>> {
  if (simulationActivee()) return succes({ compte: local.majCompte(corps) });
  return apiAppel('/me', { methode: 'PATCH', corps });
}

export async function majPreferences(corps: Partial<CompteV1['preferences']>): Promise<
  ReponseApi<{ preferences: CompteV1['preferences'] }>
> {
  if (simulationActivee()) return succes({ preferences: local.majPreferences(corps) });
  return apiAppel('/preferences', { methode: 'PATCH', corps });
}

/**
 * Suppression de compte — irréversible : données, sessions et compte.
 * Confirmation par mot de passe exigée côté serveur.
 */
export async function supprimerCompte(password: string): Promise<ReponseApi<void>> {
  if (simulationActivee()) {
    local.supprimerCompte();
    return succes(undefined);
  }
  return apiAppel('/me', { methode: 'DELETE', corps: { password } });
}

/* ───────────────────────── Sécurité & récupération ───────────────────────── */

/**
 * Appel hors /api/v1 : les routes de récupération sont publiques
 * (/api/auth/...). Même contrat d'erreur que `apiAppel`.
 */
async function appelRacine<T>(
  route: string,
  opts: { methode?: string; corps?: unknown } = {},
): Promise<ReponseApi<T>> {
  try {
    const r = await fetch(route, {
      method: opts.methode ?? 'POST',
      credentials: 'same-origin',
      headers: opts.corps !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: opts.corps !== undefined ? JSON.stringify(opts.corps) : undefined,
    });
    const d = (await r.json().catch(() => ({}))) as T & { error?: string; code?: string };
    if (r.ok) return succes(d);
    return echec(d.error ?? 'Le service ne répond pas.', d.code, r.status);
  } catch {
    return echec('Le service ne répond pas.', 'reseau');
  }
}

function indisponibleEnSimulation<T>(): ReponseApi<T> {
  return echec(
    'Action indisponible en mode démonstration : elle touche à la sécurité réelle du compte.',
    'simulation',
    0,
  );
}

/**
 * Demande de réinitialisation. Le serveur répond toujours de la même façon :
 * l'interface ne peut donc pas en déduire l'existence d'un compte.
 */
export async function demanderReinitialisation(
  email: string,
  langue: 'fr' | 'en',
): Promise<ReponseApi<{ ok: boolean }>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return appelRacine('/api/auth/forgot-password', { corps: { email, langue } });
}

/** Réinitialisation par jeton — usage unique, toutes les sessions fermées. */
export async function reinitialiserMotDePasse(
  token: string,
  password: string,
): Promise<ReponseApi<{ ok: boolean; sessionsFermees: number }>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return appelRacine('/api/auth/reset-password', { corps: { token, password } });
}

/** Confirmation d'adresse depuis le lien reçu par e-mail. */
export async function verifierEmail(
  token: string,
): Promise<ReponseApi<{ compte: CompteV1 }>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return appelRacine('/api/auth/verify-email', { corps: { token } });
}

/** Renvoi du lien de confirmation depuis une session ouverte. */
export async function renvoyerVerification(
  langue: 'fr' | 'en',
): Promise<ReponseApi<{ ok: boolean; expireDansMinutes: number }>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel('/me/email/renvoyer', { methode: 'POST', corps: { langue } });
}

/** Sessions ouvertes sur le compte (appareil, création, dernière activité). */
export async function listerSessions(): Promise<ReponseApi<{ sessions: SessionActive[] }>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel('/me/sessions');
}

/** Ferme une session distante (la session courante ne se ferme pas ici). */
export async function revoquerSession(id: string): Promise<ReponseApi<{ ok: boolean }>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel(`/me/sessions/${encodeURIComponent(id)}`, { methode: 'DELETE' });
}

/** Ferme toutes les sessions sauf l'appareil courant. */
export async function revoquerAutresSessions(): Promise<
  ReponseApi<{ ok: boolean; sessionsFermees: number }>
> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel('/me/sessions/revoquer-autrui', { methode: 'POST', corps: {} });
}

/** Changement de mot de passe : mot de passe actuel exigé, autres sessions fermées. */
export async function changerMotDePasse(
  actuel: string,
  nouveau: string,
): Promise<ReponseApi<{ ok: boolean; sessionsFermees: number }>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel('/me/password', { methode: 'POST', corps: { actuel, nouveau } });
}


/* ───────────────────────── Administration ───────────────────────── */

/**
 * État d'accès : seule information disponible sans être administrateur.
 * Elle sert à masquer le lien, jamais à autoriser quoi que ce soit — le
 * serveur revérifie à chaque appel.
 */
export async function adminEtat(): Promise<ReponseApi<{ admin: boolean; configure: boolean }>> {
  if (simulationActivee()) return succes({ admin: false, configure: false });
  return apiAppel('/admin/etat');
}

export async function adminStatistiques(): Promise<ReponseApi<AdminStatistiques>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel('/admin/statistiques');
}

export async function adminUtilisateurs(
  opts: { recherche?: string; page?: number; taille?: number } = {},
): Promise<
  ReponseApi<{ total: number; page: number; taille: number; pages: number; utilisateurs: AdminUtilisateur[] }>
> {
  if (simulationActivee()) return indisponibleEnSimulation();
  const p = new URLSearchParams();
  if (opts.recherche) p.set('recherche', opts.recherche);
  if (opts.page) p.set('page', String(opts.page));
  if (opts.taille) p.set('taille', String(opts.taille));
  const q = p.toString();
  return apiAppel(`/admin/utilisateurs${q ? `?${q}` : ''}`);
}

export async function adminUtilisateur(id: string): Promise<ReponseApi<AdminDetail>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel(`/admin/utilisateurs/${encodeURIComponent(id)}`);
}

export async function adminBannir(
  id: string,
  motif: string,
): Promise<ReponseApi<{ ok: boolean; sessionsFermees: number }>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel(`/admin/utilisateurs/${encodeURIComponent(id)}/bannir`, {
    methode: 'POST',
    corps: { motif },
  });
}

export async function adminDebannir(id: string): Promise<ReponseApi<{ ok: boolean }>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel(`/admin/utilisateurs/${encodeURIComponent(id)}/debannir`, { methode: 'POST' });
}

export async function adminRevoquerSessions(
  id: string,
): Promise<ReponseApi<{ ok: boolean; sessionsFermees: number }>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel(`/admin/utilisateurs/${encodeURIComponent(id)}/sessions/revoquer`, {
    methode: 'POST',
  });
}

export async function adminSupprimer(id: string, confirmation: string): Promise<ReponseApi<{ ok: boolean }>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel(`/admin/utilisateurs/${encodeURIComponent(id)}/supprimer`, {
    methode: 'POST',
    corps: { confirmation },
  });
}

export async function adminJournal(): Promise<ReponseApi<{ entrees: AdminJournalEntree[] }>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel('/admin/journal');
}

/* ───────────────────────── Référentiel documentaire ───────────────────────── */

export async function savoirEtat(): Promise<ReponseApi<SavoirEtat>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel('/admin/savoir/etat');
}

export async function savoirRessources(
  opts: { domaine?: string; statut?: string; q?: string } = {},
): Promise<ReponseApi<{ ressources: SavoirRessource[]; total: number }>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  const p = new URLSearchParams();
  if (opts.domaine) p.set('domaine', opts.domaine);
  if (opts.statut) p.set('statut', opts.statut);
  if (opts.q) p.set('q', opts.q);
  const q = p.toString();
  return apiAppel(`/admin/savoir/ressources${q ? `?${q}` : ''}`);
}

export async function savoirImporter(corps: {
  url?: string;
  texte?: string;
  titre?: string;
  description?: string;
  domaine: SavoirDomaine;
  pays?: string;
  organisme?: string;
  niveau: SavoirNiveau;
}): Promise<ReponseApi<{ ok: boolean; ressource: SavoirRessource | null; erreur: string | null; etapes: { etape: string; ok: boolean; detail: string }[] }>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel('/admin/savoir/ressources', { methode: 'POST', corps });
}

export async function savoirStatutRessource(
  id: string,
  statut: SavoirStatut,
): Promise<ReponseApi<{ ok: boolean; ressource: SavoirRessource }>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel(`/admin/savoir/ressources/${encodeURIComponent(id)}/statut`, {
    methode: 'POST',
    corps: { statut },
  });
}

export async function savoirReindexer(id: string): Promise<ReponseApi<{ ok: boolean }>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel(`/admin/savoir/ressources/${encodeURIComponent(id)}/reindexer`, { methode: 'POST' });
}

export async function savoirSupprimerRessource(id: string): Promise<ReponseApi<{ ok: boolean }>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel(`/admin/savoir/ressources/${encodeURIComponent(id)}`, { methode: 'DELETE' });
}

export async function savoirSources(): Promise<
  ReponseApi<{ sources: SavoirSource[]; candidats: { id: string; nom: string; hote: string }[] }>
> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel('/admin/savoir/sources');
}

export async function savoirSemer(): Promise<ReponseApi<{ crees: SavoirSource[]; ignores: number }>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel('/admin/savoir/sources/semer', { methode: 'POST' });
}

export async function savoirStatutSource(
  id: string,
  statut: 'actif' | 'a-verifier' | 'desactive',
): Promise<ReponseApi<{ ok: boolean; source: SavoirSource }>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel(`/admin/savoir/sources/${encodeURIComponent(id)}/statut`, {
    methode: 'POST',
    corps: { statut },
  });
}

export async function savoirRecherche(question: string): Promise<
  ReponseApi<{
    passages: SavoirPassageAdmin[];
    mode: 'lexical' | 'hybride';
    avertissements: string[];
    couverture: number;
  }>
> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel('/admin/savoir/recherche', { methode: 'POST', corps: { question } });
}

export async function savoirJournal(): Promise<ReponseApi<{ entrees: SavoirJournalEntreeAdmin[] }>> {
  if (simulationActivee()) return indisponibleEnSimulation();
  return apiAppel('/admin/savoir/journal');
}
