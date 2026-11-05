/**
 * Entrepôts AURA — accès aux données avec périmètre propriétaire systématique.
 *
 * - `EntrepotComptes` : comptes + sessions (index globaux d'auth).
 * - `EntrepotDonnees` : agrégat d'un utilisateur (conversations, messages,
 *   projets, missions, mémoire, recherches, créations, événements).
 *
 * Règles : toute lecture/écriture de données utilisateur passe par un
 * userId ; les identifiants inconnus renvoient null — jamais de donnée
 * d'un autre compte. Schéma versionné avec migrations à la lecture.
 * Les anciens dépôts (data/comptes.json, KV aura:comptes) sont migrés
 * automatiquement pour ne perdre aucun compte existant.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  CLE,
  choisirBase,
  modifier,
  type BaseDeDonnees,
} from './base';
import {
  donneesVides,
  SCHEMA_VERSION,
  type Compte,
  type Conversation,
  type Creation,
  type DonneesUtilisateur,
  type EvenementUsage,
  type Memoire,
  type Message,
  type Mission,
  type Projet,
  type Recherche,
  type Session,
  type SourceRecherche,
  type VersionCreation,
} from './types';

export function nouvelId(prefixe = ''): string {
  const brut = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return prefixe ? `${prefixe}-${brut}` : brut;
}

/* ───────────────────────── Migrations ───────────────────────── */

/** Migration du schéma de l'agrégat utilisateur (n → SCHEMA_VERSION). */
export function migrerDonnees(brut: unknown): DonneesUtilisateur {
  const d = (brut ?? {}) as Partial<DonneesUtilisateur>;
  const base = donneesVides();
  const out: DonneesUtilisateur = {
    schemaVersion: SCHEMA_VERSION,
    conversations: Array.isArray(d.conversations) ? d.conversations : base.conversations,
    messages: Array.isArray(d.messages) ? d.messages : base.messages,
    projets: Array.isArray(d.projets) ? d.projets : base.projets,
    missions: Array.isArray(d.missions) ? d.missions : base.missions,
    memoires: Array.isArray(d.memoires) ? d.memoires : base.memoires,
    recherches: Array.isArray(d.recherches) ? d.recherches : base.recherches,
    sources: Array.isArray(d.sources) ? d.sources : base.sources,
    creations: Array.isArray(d.creations) ? d.creations : base.creations,
    evenements: Array.isArray(d.evenements) ? d.evenements : base.evenements,
  };
  // v1 → v2 : les missions sans sousTaches/notes/ordre sont complétées.
  for (const m of out.missions) {
    if (!Array.isArray(m.sousTaches)) m.sousTaches = [];
    if (typeof m.notes !== 'string') m.notes = '';
    if (typeof m.ordre !== 'number') m.ordre = 0;
    if (!m.echeance) m.echeance = null;
    if (!m.statut) m.statut = 'a_faire';
    if (!m.priorite) m.priorite = 'moyenne';
  }
  for (const v of out.creations) {
    if (!Array.isArray(v.versions)) v.versions = [];
    if (!v.statut) v.statut = 'terminee';
    if (v.erreur === undefined) v.erreur = null;
    if (v.projectId === undefined) v.projectId = null;
  }
  for (const c of out.conversations) {
    if (c.projectId === undefined) c.projectId = null;
    if (!c.archive) c.archive = false;
  }
  return out;
}

type AncienCompte = Compte & { motDePasse?: string };

/** Migration de l'ancien dépôt unique {utilisateurs, sessions} vers aurav1:*. */
export async function migrerAncienDepot(base: BaseDeDonnees, sourceFichier?: string): Promise<void> {
  try {
    let brut: unknown = null;
    if (sourceFichier) {
      try {
        brut = JSON.parse(await fs.readFile(sourceFichier, 'utf8'));
      } catch {
        brut = null;
      }
    }
    if (!brut && base.mode === 'kv') {
      brut = await base.lire(CLE.ancienKv);
    }
    if (!brut && base.mode === 'fichier') {
      // data/comptes.json (ancien MagasinFichier) au même emplacement.
      const ancien = path.join(path.dirname((base as unknown as { fichier?: string }).fichier ?? ''), 'comptes.json');
      try {
        brut = JSON.parse(await fs.readFile(ancien, 'utf8'));
      } catch {
        brut = null;
      }
    }
    const d = (brut ?? {}) as { utilisateurs?: AncienCompte[]; sessions?: Session[] };
    const utilisateurs = Array.isArray(d.utilisateurs) ? d.utilisateurs : [];
    const sessions = Array.isArray(d.sessions) ? d.sessions : [];
    if (utilisateurs.length === 0 && sessions.length === 0) return;

    for (const u of utilisateurs) {
      if (!u || typeof u.id !== 'string' || typeof u.email !== 'string') continue;
      const existant = await base.lire<Compte>(CLE.compte(u.id));
      if (existant) continue;
      const { motDePasse: _jete, ...propre } = u; // jamais de secret hérité inutile
      const compte: Compte = {
        ...propre,
        onboarding: propre.onboarding ?? { fait: false, objectif: null },
        profil: propre.profil ?? profilParDefaut(),
        preferences: propre.preferences ?? preferencesParDefaut(),
      };
      await base.ecrire(CLE.compte(compte.id), compte);
      await base.ecrire(CLE.compteParEmail(compte.email), compte.id);
    }
    for (const s of sessions) {
      if (!s || typeof s.id !== 'string' || typeof s.userId !== 'string') continue;
      if (s.expire <= Date.now()) continue;
      await base.ecrire(CLE.session(s.id), s);
    }
    // L'ancien dépôt n'est pas supprimé : il reste comme sauvegarde de secours.
  } catch {
    /* migration best-effort : le nouveau dépôt continue de fonctionner */
  }
}

export function profilParDefaut(): Compte['profil'] {
  return {
    pays: null,
    region: null,
    languePrincipale: 'fr',
    languesSecondaires: [],
    devise: null,
    fuseau: null,
    unites: 'metriques',
    domaine: null,
  };
}

export function preferencesParDefaut(): Compte['preferences'] {
  return { tonReponse: 'concis', utiliserMemoire: true, langueReponse: 'auto' };
}

/* ───────────────────────── Comptes & sessions ───────────────────────── */

export class EntrepotComptes {
  constructor(private readonly base: BaseDeDonnees) {}

  get mode() {
    return this.base.mode;
  }
  get raison() {
    return this.base.raison;
  }

  async parId(id: string): Promise<Compte | null> {
    return this.base.lire<Compte>(CLE.compte(id));
  }

  async parEmail(email: string): Promise<Compte | null> {
    const id = await this.base.lire<string>(CLE.compteParEmail(email));
    if (!id) return null;
    return this.parId(id);
  }

  async creer(compte: Compte): Promise<void> {
    await this.base.ecrire(CLE.compte(compte.id), compte);
    await this.base.ecrire(CLE.compteParEmail(compte.email), compte.id);
  }

  async enregistrer(compte: Compte): Promise<void> {
    await this.base.ecrire(CLE.compte(compte.id), compte);
    await this.base.ecrire(CLE.compteParEmail(compte.email), compte.id);
  }

  async creerSession(session: Session): Promise<void> {
    await this.base.ecrire(CLE.session(session.id), session);
  }

  async sessionParEmpreinte(empreinte: string): Promise<Session | null> {
    const s = await this.base.lire<Session>(CLE.session(empreinte));
    if (!s) return null;
    if (s.expire <= Date.now()) {
      await this.base.supprimer(CLE.session(empreinte));
      return null;
    }
    return s;
  }

  async supprimerSession(empreinte: string): Promise<void> {
    await this.base.supprimer(CLE.session(empreinte));
  }

  async sessionsDe(userId: string): Promise<Session[]> {
    const cles = await this.base.lister('aurav1:session:');
    const sessions: Session[] = [];
    for (const c of cles) {
      const s = await this.base.lire<Session>(c);
      if (s && s.userId === userId && s.expire > Date.now()) sessions.push(s);
    }
    return sessions;
  }
}

/* ───────────────────────── Données utilisateur ───────────────────────── */

const PLAFOND_MESSAGES = 3000;
const PLAFOND_MESSAGES_FIL = 300;
const PLAFOND_EVENEMENTS = 500;

export class EntrepotDonnees {
  constructor(
    private readonly base: BaseDeDonnees,
    private readonly userId: string,
  ) {}

  private async maj(fn: (d: DonneesUtilisateur) => void): Promise<DonneesUtilisateur> {
    return modifier(this.base, CLE.donnees(this.userId), donneesVides(), (d) => {
      const charge = migrerDonnees(d);
      fn(charge);
      // Plafonds : les plus anciens éléments sont élagués (hors projets).
      if (charge.messages.length > PLAFOND_MESSAGES) {
        charge.messages = charge.messages.slice(-PLAFOND_MESSAGES);
      }
      if (charge.evenements.length > PLAFOND_EVENEMENTS) {
        charge.evenements = charge.evenements.slice(-PLAFOND_EVENEMENTS);
      }
      return charge;
    });
  }

  async tout(): Promise<DonneesUtilisateur> {
    const brut = await this.base.lire<unknown>(CLE.donnees(this.userId));
    return migrerDonnees(brut);
  }

  /* ── Conversations ── */

  async conversations(opts: { inclureArchivees?: boolean } = {}): Promise<Conversation[]> {
    const d = await this.tout();
    const liste = opts.inclureArchivees
      ? d.conversations
      : d.conversations.filter((c) => !c.archive);
    return [...liste].sort((a, b) => (a.maj < b.maj ? 1 : -1));
  }

  async conversation(id: string): Promise<Conversation | null> {
    const d = await this.tout();
    return d.conversations.find((c) => c.id === id) ?? null;
  }

  async creerConversation(c: Omit<Conversation, 'userId'>): Promise<Conversation> {
    const conv: Conversation = { ...c, userId: this.userId };
    await this.maj((d) => {
      d.conversations = [conv, ...d.conversations];
    });
    return conv;
  }

  async majConversation(id: string, patch: Partial<Conversation>): Promise<Conversation | null> {
    let resultat: Conversation | null = null;
    await this.maj((d) => {
      const c = d.conversations.find((x) => x.id === id);
      if (!c) return;
      Object.assign(c, patch, { id: c.id, userId: c.userId, maj: new Date().toISOString() });
      resultat = c;
    });
    return resultat;
  }

  async supprimerConversation(id: string): Promise<boolean> {
    let trouve = false;
    await this.maj((d) => {
      const avant = d.conversations.length;
      d.conversations = d.conversations.filter((c) => c.id !== id);
      d.messages = d.messages.filter((m) => m.conversationId !== id);
      trouve = d.conversations.length < avant;
    });
    return trouve;
  }

  /* ── Messages ── */

  async messages(conversationId: string, opts: { limite?: number } = {}): Promise<Message[]> {
    const d = await this.tout();
    const liste = d.messages.filter((m) => m.conversationId === conversationId);
    const limite = opts.limite ?? PLAFOND_MESSAGES_FIL;
    return liste.slice(-limite);
  }

  async ajouterMessage(m: Omit<Message, 'userId'>): Promise<Message> {
    const message: Message = { ...m, userId: this.userId };
    await this.maj((d) => {
      d.messages.push(message);
      const conv = d.conversations.find((c) => c.id === m.conversationId);
      if (conv) conv.maj = message.cree;
      // Élagage par fil : le plus ancien message du fil sort au-delà du plafond.
      const duFil = d.messages.filter((x) => x.conversationId === m.conversationId);
      if (duFil.length > PLAFOND_MESSAGES_FIL) {
        const aRetirer = new Set(duFil.slice(0, duFil.length - PLAFOND_MESSAGES_FIL).map((x) => x.id));
        d.messages = d.messages.filter((x) => !aRetirer.has(x.id));
      }
    });
    return message;
  }

  async majMessage(conversationId: string, messageId: string, patch: Partial<Message>): Promise<Message | null> {
    let resultat: Message | null = null;
    await this.maj((d) => {
      const m = d.messages.find((x) => x.id === messageId && x.conversationId === conversationId);
      if (!m) return;
      Object.assign(m, patch, { id: m.id, userId: m.userId, conversationId: m.conversationId });
      resultat = m;
    });
    return resultat;
  }

  /* ── Projets ── */

  async projets(opts: { inclureArchives?: boolean } = {}): Promise<Projet[]> {
    const d = await this.tout();
    const liste = opts.inclureArchives ? d.projets : d.projets.filter((p) => p.statut !== 'archive');
    return [...liste].sort((a, b) => (a.maj < b.maj ? 1 : -1));
  }

  async projet(id: string): Promise<Projet | null> {
    const d = await this.tout();
    return d.projets.find((p) => p.id === id) ?? null;
  }

  async creerProjet(p: Omit<Projet, 'userId'>): Promise<Projet> {
    const projet: Projet = { ...p, userId: this.userId };
    await this.maj((d) => {
      d.projets = [projet, ...d.projets];
    });
    return projet;
  }

  async majProjet(id: string, patch: Partial<Projet>): Promise<Projet | null> {
    let resultat: Projet | null = null;
    await this.maj((d) => {
      const p = d.projets.find((x) => x.id === id);
      if (!p) return;
      Object.assign(p, patch, { id: p.id, userId: p.userId, maj: new Date().toISOString() });
      resultat = p;
    });
    return resultat;
  }

  async supprimerProjet(id: string): Promise<boolean> {
    let trouve = false;
    await this.maj((d) => {
      const avant = d.projets.length;
      d.projets = d.projets.filter((p) => p.id !== id);
      // Les éléments rattachés sont détachés (pas de suppression en cascade
      // des conversations : l'utilisateur garde son travail).
      d.conversations.forEach((c) => {
        if (c.projectId === id) c.projectId = null;
      });
      d.missions.forEach((m) => {
        if (m.projectId === id) m.projectId = null;
      });
      d.memoires.forEach((m) => {
        if (m.projectId === id) m.projectId = null;
      });
      d.recherches.forEach((r) => {
        if (r.projectId === id) r.projectId = null;
      });
      d.creations.forEach((c) => {
        if (c.projectId === id) c.projectId = null;
      });
      trouve = d.projets.length < avant;
    });
    return trouve;
  }

  /* ── Missions ── */

  async missions(opts: { projectId?: string | null; statut?: string } = {}): Promise<Mission[]> {
    const d = await this.tout();
    let liste = d.missions;
    if (opts.projectId !== undefined) {
      liste = liste.filter((m) => m.projectId === opts.projectId);
    }
    if (opts.statut) {
      liste = liste.filter((m) => m.statut === opts.statut);
    }
    return [...liste].sort((a, b) => a.ordre - b.ordre || (a.cree < b.cree ? 1 : -1));
  }

  async mission(id: string): Promise<Mission | null> {
    const d = await this.tout();
    return d.missions.find((m) => m.id === id) ?? null;
  }

  async creerMission(m: Omit<Mission, 'userId'>): Promise<Mission> {
    const mission: Mission = { ...m, userId: this.userId };
    await this.maj((d) => {
      d.missions = [...d.missions, mission];
    });
    return mission;
  }

  async majMission(id: string, patch: Partial<Mission>): Promise<Mission | null> {
    let resultat: Mission | null = null;
    await this.maj((d) => {
      const m = d.missions.find((x) => x.id === id);
      if (!m) return;
      Object.assign(m, patch, { id: m.id, userId: m.userId, maj: new Date().toISOString() });
      resultat = m;
    });
    return resultat;
  }

  async supprimerMission(id: string): Promise<boolean> {
    let trouve = false;
    await this.maj((d) => {
      const avant = d.missions.length;
      d.missions = d.missions.filter((m) => m.id !== id);
      trouve = d.missions.length < avant;
    });
    return trouve;
  }

  /* ── Mémoire ── */

  async memoires(opts: { actives?: boolean; projectId?: string | null } = {}): Promise<Memoire[]> {
    const d = await this.tout();
    let liste = d.memoires;
    if (opts.actives === true) liste = liste.filter((m) => m.actif);
    if (opts.projectId !== undefined) liste = liste.filter((m) => m.projectId === opts.projectId);
    return [...liste].sort((a, b) => (a.cree < b.cree ? 1 : -1));
  }

  async memoire(id: string): Promise<Memoire | null> {
    const d = await this.tout();
    return d.memoires.find((m) => m.id === id) ?? null;
  }

  async creerMemoire(m: Omit<Memoire, 'userId'>): Promise<Memoire> {
    const memoire: Memoire = { ...m, userId: this.userId };
    await this.maj((d) => {
      d.memoires = [memoire, ...d.memoires];
    });
    return memoire;
  }

  async majMemoire(id: string, patch: Partial<Memoire>): Promise<Memoire | null> {
    let resultat: Memoire | null = null;
    await this.maj((d) => {
      const m = d.memoires.find((x) => x.id === id);
      if (!m) return;
      Object.assign(m, patch, { id: m.id, userId: m.userId, maj: new Date().toISOString() });
      resultat = m;
    });
    return resultat;
  }

  async supprimerMemoire(id: string): Promise<boolean> {
    let trouve = false;
    await this.maj((d) => {
      const avant = d.memoires.length;
      d.memoires = d.memoires.filter((m) => m.id !== id);
      trouve = d.memoires.length < avant;
    });
    return trouve;
  }

  async viderMemoires(): Promise<number> {
    let n = 0;
    await this.maj((d) => {
      n = d.memoires.length;
      d.memoires = [];
    });
    return n;
  }

  /* ── Recherches ── */

  async recherches(): Promise<Recherche[]> {
    const d = await this.tout();
    return [...d.recherches].sort((a, b) => (a.cree < b.cree ? 1 : -1));
  }

  async recherche(id: string): Promise<Recherche | null> {
    const d = await this.tout();
    return d.recherches.find((r) => r.id === id) ?? null;
  }

  async creerRecherche(r: Omit<Recherche, 'userId'>, sources: Omit<SourceRecherche, 'userId'>[]): Promise<Recherche> {
    const recherche: Recherche = { ...r, userId: this.userId };
    await this.maj((d) => {
      d.recherches = [recherche, ...d.recherches].slice(0, 200);
      d.sources = [...sources.map((s) => ({ ...s, userId: this.userId })), ...d.sources].slice(0, 1000);
    });
    return recherche;
  }

  async sources(rechercheId: string): Promise<SourceRecherche[]> {
    const d = await this.tout();
    return d.sources.filter((s) => s.rechercheId === rechercheId);
  }

  async supprimerRecherche(id: string): Promise<boolean> {
    let trouve = false;
    await this.maj((d) => {
      const avant = d.recherches.length;
      d.recherches = d.recherches.filter((r) => r.id !== id);
      d.sources = d.sources.filter((s) => s.rechercheId !== id);
      trouve = d.recherches.length < avant;
    });
    return trouve;
  }

  /* ── Studio ── */

  async creations(): Promise<Creation[]> {
    const d = await this.tout();
    return [...d.creations].sort((a, b) => (a.maj < b.maj ? 1 : -1));
  }

  async creation(id: string): Promise<Creation | null> {
    const d = await this.tout();
    return d.creations.find((c) => c.id === id) ?? null;
  }

  async creerCreation(c: Omit<Creation, 'userId'>): Promise<Creation> {
    const creation: Creation = { ...c, userId: this.userId };
    await this.maj((d) => {
      d.creations = [creation, ...d.creations].slice(0, 300);
    });
    return creation;
  }

  async majCreation(id: string, patch: Partial<Creation>): Promise<Creation | null> {
    let resultat: Creation | null = null;
    await this.maj((d) => {
      const c = d.creations.find((x) => x.id === id);
      if (!c) return;
      Object.assign(c, patch, { id: c.id, userId: c.userId, maj: new Date().toISOString() });
      resultat = c;
    });
    return resultat;
  }

  async ajouterVersion(id: string, version: Omit<VersionCreation, 'id'>): Promise<Creation | null> {
    let resultat: Creation | null = null;
    await this.maj((d) => {
      const c = d.creations.find((x) => x.id === id);
      if (!c) return;
      c.versions.push({ ...version, id: nouvelId('ver') });
      c.maj = new Date().toISOString();
      resultat = c;
    });
    return resultat;
  }

  async supprimerCreation(id: string): Promise<boolean> {
    let trouve = false;
    await this.maj((d) => {
      const avant = d.creations.length;
      d.creations = d.creations.filter((c) => c.id !== id);
      trouve = d.creations.length < avant;
    });
    return trouve;
  }

  /* ── Événements techniques (jamais de contenu privé) ── */

  async enregistrerEvenement(e: Omit<EvenementUsage, 'userId'>): Promise<void> {
    await this.maj((d) => {
      d.evenements.push({ ...e, userId: this.userId });
    });
  }
}

/* ───────────────────────── Fabrique ───────────────────────── */

let baseSingleton: BaseDeDonnees | null = null;
let migrationFaite = false;

export function baseDeDonnees(): BaseDeDonnees {
  if (!baseSingleton) {
    baseSingleton = choisirBase();
    void migrerAncienDepot(baseSingleton);
    migrationFaite = true;
  }
  return baseSingleton;
}

export function entrepotComptes(): EntrepotComptes {
  return new EntrepotComptes(baseDeDonnees());
}

export function entrepotDonnees(userId: string): EntrepotDonnees {
  return new EntrepotDonnees(baseDeDonnees(), userId);
}

export { migrationFaite };
