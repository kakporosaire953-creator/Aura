/**
 * Stockage local du mode simulation — mêmes contrats que l'API v1,
 * données strictement locales au navigateur et clairement étiquetées
 * « simulées » (bannière permanente + badges). Jamais présenté comme réel.
 */
import type {
  Capabilities,
  CompteV1,
  Conversation,
  Creation,
  Memoire,
  MessageChat,
  Mission,
  PrioriteMission,
  Projet,
  PropositionMission,
  Recherche,
  SourceRecherche,
  StatutMission,
  TypeCreation,
  TypeMemoire,
} from './types';

type DonneesLocal = {
  conversations: Conversation[];
  messages: Record<string, MessageChat[]>;
  projets: Projet[];
  missions: Mission[];
  memoires: Memoire[];
  recherches: Recherche[];
  sources: Record<string, SourceRecherche[]>;
  creations: Creation[];
  compte: CompteV1;
};

const CLE = 'aura_local_v1';

function id(prefixe: string): string {
  return `${prefixe}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function charger(): DonneesLocal {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) ?? 'null') as DonneesLocal | null;
    if (brut && brut.conversations) return brut;
  } catch {
    /* stockage corrompu → on repart d'un état vide */
  }
  return vider();
}

function vider(): DonneesLocal {
  return {
    conversations: [],
    messages: {},
    projets: [],
    missions: [],
    memoires: [],
    recherches: [],
    sources: {},
    creations: [],
    compte: {
      id: 'demo',
      email: 'demo@local',
      nom: '',
      cree: new Date().toISOString(),
      onboarding: { fait: false, objectif: null },
      profil: {
        pays: null,
        region: null,
        languePrincipale: 'fr',
        languesSecondaires: [],
        devise: null,
        fuseau: null,
        unites: 'metriques',
        domaine: null,
      },
      preferences: { tonReponse: 'concis', utiliserMemoire: true, langueReponse: 'auto' },
    },
  };
}

function persister(d: DonneesLocal): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(d));
  } catch {
    /* stockage plein — l'UI continue */
  }
}

function maintenant(): string {
  return new Date().toISOString();
}

export function capabilities(): Capabilities {
  return {
    comptes: false,
    persistance: { ok: true, mode: 'local-simulation' },
    assistant: { ok: true, streaming: true, sortieStructuree: true, raison: 'Réponses simulées (mode démonstration).' },
    recherche: { ok: false, raison: 'Mode démonstration : la recherche réelle nécessite le moteur configuré.' },
    studio: { ok: true, raison: 'Créations simulées (mode démonstration).' },
    images: { ok: false, raison: 'Non disponible.' },
    fichiers: { ok: false, raison: 'Non disponible.' },
  };
}

/* ── Conversations ── */

export function listerConversations(opts: { q?: string; projectId?: string } = {}): Conversation[] {
  const d = charger();
  let liste = d.conversations.filter((c) => !c.archive);
  if (opts.projectId) liste = liste.filter((c) => c.projectId === opts.projectId);
  if (opts.q) liste = liste.filter((c) => c.titre.toLowerCase().includes(opts.q!.toLowerCase()));
  return [...liste].sort((a, b) => (a.maj < b.maj ? 1 : -1));
}

export function creerConversation(corps: { titre?: string; projectId?: string | null }): Conversation {
  const d = charger();
  const conv: Conversation = {
    id: id('conv'),
    projectId: corps.projectId ?? null,
    titre: corps.titre?.trim() || 'Nouvelle conversation',
    archive: false,
    cree: maintenant(),
    maj: maintenant(),
  };
  d.conversations.unshift(conv);
  d.messages[conv.id] = [];
  persister(d);
  return conv;
}

export function ouvrirConversation(
  idConv: string,
): { ok: true; donnees: { conversation: Conversation; messages: MessageChat[] } } | { ok: false; erreur: string; statut: number } {
  const d = charger();
  const conv = d.conversations.find((c) => c.id === idConv);
  if (!conv) return { ok: false, erreur: 'Ressource introuvable.', statut: 404 };
  return { ok: true, donnees: { conversation: conv, messages: d.messages[idConv] ?? [] } };
}

export function majConversation(
  idConv: string,
  patch: { titre?: string; archive?: boolean; projectId?: string | null },
): Conversation {
  const d = charger();
  const conv = d.conversations.find((c) => c.id === idConv)!;
  if (patch.titre !== undefined) conv.titre = patch.titre;
  if (patch.archive !== undefined) conv.archive = patch.archive;
  if (patch.projectId !== undefined) conv.projectId = patch.projectId;
  conv.maj = maintenant();
  persister(d);
  return conv;
}

export function supprimerConversation(idConv: string): void {
  const d = charger();
  d.conversations = d.conversations.filter((c) => c.id !== idConv);
  delete d.messages[idConv];
  persister(d);
}

export async function envoyerMessage(
  idConv: string,
  contenu: string,
  opts: { langue?: 'fr' | 'en'; onChunk?: (t: string) => void; signal?: AbortSignal; regenerer?: boolean } = {},
): Promise<{ ok: true; donnees: { message: MessageChat; reponse: MessageChat } } | { ok: false; erreur: string; code?: string; statut: number }> {
  const d = charger();
  const conv = d.conversations.find((c) => c.id === idConv);
  if (!conv) return { ok: false, erreur: 'Ressource introuvable.', statut: 404 };

  let message: MessageChat;
  if (opts.regenerer) {
    const existants = d.messages[idConv] ?? [];
    const dernierUser = [...existants].reverse().find((m) => m.role === 'user');
    if (!dernierUser) return { ok: false, erreur: 'Saisie invalide.', code: 'validation', statut: 400 };
    message = dernierUser;
    d.messages[idConv] = existants.filter((m) => m.role !== 'assistant');
  } else {
    message = {
      id: id('msg'),
      conversationId: idConv,
      role: 'user',
      content: contenu,
      statut: 'envoye',
      cree: maintenant(),
      meta: null,
    };
    d.messages[idConv] = [...(d.messages[idConv] ?? []), message];
    if (conv.titre === 'Nouvelle conversation') conv.titre = contenu.slice(0, 80);
    conv.maj = maintenant();
    persister(d);
  }

  // Réponse simulée — étiquetée telle quelle dans le contenu du message badge UI.
  const base = opts.regenerer ? String(message.content).slice(0, 60) : contenu.slice(0, 60);
  const reponseTexte =
    opts.langue === 'en'
      ? `[Demonstration mode] Simulated answer to “${base}”. Configure the server engine for real answers.`
      : `[Mode démonstration] Réponse simulée à « ${base} ». Configurez le moteur serveur pour des réponses réelles.`;

  await new Promise<void>((resolve) => {
    const t = setTimeout(resolve, 600);
    opts.signal?.addEventListener('abort', () => {
      clearTimeout(t);
      resolve();
    });
  });
  if (opts.signal?.aborted) {
    return { ok: false, erreur: 'Génération interrompue.', code: 'annule', statut: 0 };
  }

  if (opts.onChunk) {
    for (const mot of reponseTexte.split(' ')) {
      opts.onChunk(mot + ' ');
      await new Promise((r) => setTimeout(r, 25));
    }
  }

  const reponse: MessageChat = {
    id: id('msg'),
    conversationId: idConv,
    role: 'assistant',
    content: reponseTexte,
    statut: 'genere',
    cree: maintenant(),
    meta: { modele: 'simulation', memoiresUtilisees: [] },
  };
  d.messages[idConv] = [...d.messages[idConv], reponse];
  persister(d);
  return { ok: true, donnees: { message, reponse } };
}

/* ── Projets ── */

export function listerProjets(opts: { archives?: boolean } = {}): Projet[] {
  const d = charger();
  const liste = opts.archives ? d.projets : d.projets.filter((p) => p.statut !== 'archive');
  return [...liste].sort((a, b) => (a.maj < b.maj ? 1 : -1));
}

export function creerProjet(corps: { nom: string; description?: string; objectif?: string; categorie?: string; instructions?: string }): Projet {
  const d = charger();
  const projet: Projet = {
    id: id('prj'),
    nom: corps.nom,
    description: corps.description ?? '',
    objectif: corps.objectif ?? '',
    categorie: corps.categorie ?? '',
    instructions: corps.instructions ?? '',
    statut: 'actif',
    cree: maintenant(),
    maj: maintenant(),
  };
  d.projets.unshift(projet);
  persister(d);
  return projet;
}

export function ouvrirProjet(idProjet: string) {
  const d = charger();
  const projet = d.projets.find((p) => p.id === idProjet);
  if (!projet) {
    return { ok: false as const, erreur: 'Ressource introuvable.', code: 'introuvable', statut: 404 };
  }
  return {
    ok: true as const,
    donnees: {
      projet,
      conversations: d.conversations.filter((c) => c.projectId === idProjet),
      missions: d.missions.filter((m) => m.projectId === idProjet),
      memoires: d.memoires.filter((m) => m.projectId === idProjet),
      creations: d.creations.filter((c) => c.projectId === idProjet),
      recherches: d.recherches.filter((r) => r.projectId === idProjet),
    },
  };
}

export function majProjet(idProjet: string, patch: Partial<Projet>): Projet {
  const d = charger();
  const p = d.projets.find((x) => x.id === idProjet)!;
  Object.assign(p, patch, { maj: maintenant() });
  persister(d);
  return p;
}

export function supprimerProjet(idProjet: string): void {
  const d = charger();
  d.projets = d.projets.filter((p) => p.id !== idProjet);
  for (const c of d.conversations) if (c.projectId === idProjet) c.projectId = null;
  for (const m of d.missions) if (m.projectId === idProjet) m.projectId = null;
  for (const m of d.memoires) if (m.projectId === idProjet) m.projectId = null;
  persister(d);
}

/* ── Missions ── */

export function listerMissions(opts: { projectId?: string | null; statut?: string } = {}): Mission[] {
  const d = charger();
  let liste = d.missions;
  if (opts.projectId !== undefined) liste = liste.filter((m) => m.projectId === opts.projectId);
  if (opts.statut) liste = liste.filter((m) => m.statut === opts.statut);
  return [...liste].sort((a, b) => a.ordre - b.ordre);
}

function nouvelleMission(
  corps: {
    titre: string;
    description?: string;
    priorite?: PrioriteMission;
    statut?: StatutMission;
    echeance?: string | null;
    projectId?: string | null;
    sousTaches?: string[];
    notes?: string;
  },
): Mission {
  return {
    id: id('msn'),
    projectId: corps.projectId ?? null,
    titre: corps.titre,
    description: corps.description ?? '',
    priorite: corps.priorite ?? 'moyenne',
    statut: corps.statut ?? 'a_faire',
    echeance: corps.echeance ?? null,
    ordre: Date.now(),
    sousTaches: (corps.sousTaches ?? []).map((s) => ({ id: id('st'), titre: s, fait: false })),
    notes: corps.notes ?? '',
    cree: maintenant(),
    maj: maintenant(),
  };
}

export function creerMission(corps: Parameters<typeof nouvelleMission>[0]): Mission {
  const d = charger();
  const mission = nouvelleMission(corps);
  d.missions.push(mission);
  persister(d);
  return mission;
}

export function majMission(idMission: string, patch: Partial<Mission>): Mission {
  const d = charger();
  const m = d.missions.find((x) => x.id === idMission)!;
  Object.assign(m, patch, { maj: maintenant() });
  persister(d);
  return m;
}

export function supprimerMission(idMission: string): void {
  const d = charger();
  d.missions = d.missions.filter((m) => m.id !== idMission);
  persister(d);
}

export async function aideMissions(objectif: string) {
  await new Promise((r) => setTimeout(r, 500));
  const base = objectif.slice(0, 60);
  const proposition: PropositionMission[] = [
    {
      titre: `Cadrer « ${base} »`,
      description: 'Proposition simulée : préciser le périmètre, les livrables attendus et les contraintes.',
      priorite: 'haute',
      echeance: null,
      sousTaches: ['Lister les livrables', 'Identifier les contraintes'],
    },
    {
      titre: `Réaliser « ${base} »`,
      description: 'Proposition simulée : organiser la production par étapes vérifiables.',
      priorite: 'moyenne',
      echeance: null,
      sousTaches: ['Découper en étapes', 'Produire une première version'],
    },
    {
      titre: `Valider « ${base} »`,
      description: 'Proposition simulée : vérifier le résultat et préparer la communication.',
      priorite: 'basse',
      echeance: null,
      sousTaches: ['Vérifier le résultat'],
    },
  ];
  return {
    ok: true as const,
    donnees: {
      proposition,
      note: 'Mode démonstration : propositions simulées, non générées par un moteur IA.',
    },
  };
}

/* ── Mémoire ── */

export function listerMemoires(opts: { actives?: boolean; projectId?: string | null } = {}): Memoire[] {
  const d = charger();
  let liste = d.memoires;
  if (opts.actives) liste = liste.filter((m) => m.actif);
  if (opts.projectId !== undefined) liste = liste.filter((m) => m.projectId === opts.projectId);
  return [...liste].sort((a, b) => (a.cree < b.cree ? 1 : -1));
}

export function creerMemoire(corps: { contenu: string; type?: TypeMemoire; projectId?: string | null }): Memoire {
  const d = charger();
  const memoire: Memoire = {
    id: id('mem'),
    projectId: corps.projectId ?? null,
    type: corps.type ?? 'contexte_personnel',
    contenu: corps.contenu,
    actif: true,
    cree: maintenant(),
    maj: maintenant(),
  };
  d.memoires.unshift(memoire);
  persister(d);
  return memoire;
}

export function majMemoire(idMemoire: string, patch: Partial<Memoire>): Memoire {
  const d = charger();
  const m = d.memoires.find((x) => x.id === idMemoire)!;
  Object.assign(m, patch, { maj: maintenant() });
  persister(d);
  return m;
}

export function supprimerMemoire(idMemoire: string): void {
  const d = charger();
  d.memoires = d.memoires.filter((m) => m.id !== idMemoire);
  persister(d);
}

export function viderMemoires(): number {
  const d = charger();
  const n = d.memoires.length;
  d.memoires = [];
  persister(d);
  return n;
}

/* ── Recherches ── */

export function listerRecherches(): Recherche[] {
  const d = charger();
  return [...d.recherches].sort((a, b) => (a.cree < b.cree ? 1 : -1));
}

export function ouvrirRecherche(idRecherche: string) {
  const d = charger();
  const recherche = d.recherches.find((r) => r.id === idRecherche);
  if (!recherche) {
    return { ok: false as const, erreur: 'Ressource introuvable.', code: 'introuvable', statut: 404 };
  }
  return { ok: true as const, donnees: { recherche, sources: d.sources[idRecherche] ?? [] } };
}

export async function lancerRecherche(corps: { requete: string; projectId?: string | null }) {
  await new Promise((r) => setTimeout(r, 400));
  return {
    ok: false as const,
    erreur:
      'Mode démonstration : la recherche réelle n’est pas simulée. Configurez le moteur serveur pour activer Explorer.',
    code: 'recherche-indisponible',
    statut: 503,
  };
}

export function supprimerRecherche(idRecherche: string): void {
  const d = charger();
  d.recherches = d.recherches.filter((r) => r.id !== idRecherche);
  delete d.sources[idRecherche];
  persister(d);
}

/* ── Studio ── */

export function listerCreations(): Creation[] {
  const d = charger();
  return [...d.creations].sort((a, b) => (a.maj < b.maj ? 1 : -1));
}

export function creerCreation(corps: { type: TypeCreation; instruction: string; titre?: string; projectId?: string | null }): Creation {
  const d = charger();
  const creation: Creation = {
    id: id('job'),
    projectId: corps.projectId ?? null,
    type: corps.type,
    titre: corps.titre?.trim() || corps.instruction.slice(0, 70),
    instruction: corps.instruction,
    statut: 'terminee',
    erreur: null,
    versions: [
      {
        id: id('ver'),
        numero: 1,
        contenu:
          `[Mode démonstration — création simulée]\n\nInstruction : ${corps.instruction}\n\n` +
          'Configurez le moteur serveur (clé API) pour une génération réelle.',
        note: 'Génération initiale (simulée)',
        cree: maintenant(),
      },
    ],
    cree: maintenant(),
    maj: maintenant(),
  };
  d.creations.unshift(creation);
  persister(d);
  return creation;
}

export function ouvrirCreation(idCreation: string) {
  const d = charger();
  const job = d.creations.find((c) => c.id === idCreation);
  if (!job) return { ok: false as const, erreur: 'Ressource introuvable.', code: 'introuvable', statut: 404 };
  return { ok: true as const, donnees: { job } };
}

export function reviserCreation(idCreation: string, instruction: string): Creation {
  const d = charger();
  const job = d.creations.find((c) => c.id === idCreation)!;
  const derniere = job.versions[job.versions.length - 1];
  job.versions.push({
    id: id('ver'),
    numero: (derniere?.numero ?? 0) + 1,
    contenu: `${derniere?.contenu ?? ''}\n\n---\n\n[Révision simulée] ${instruction}`,
    note: `Révision (simulée) : ${instruction.slice(0, 100)}`,
    cree: maintenant(),
  });
  job.maj = maintenant();
  persister(d);
  return job;
}

export function supprimerCreation(idCreation: string): void {
  const d = charger();
  d.creations = d.creations.filter((c) => c.id !== idCreation);
  persister(d);
}

/* ── Compte ── */

export function compteSimule(): CompteV1 | null {
  return charger().compte;
}

export function majCompte(corps: { nom?: string; profil?: Partial<CompteV1['profil']> }): CompteV1 {
  const d = charger();
  if (corps.nom !== undefined) d.compte.nom = corps.nom;
  if (corps.profil) Object.assign(d.compte.profil, corps.profil);
  persister(d);
  return d.compte;
}

export function majPreferences(corps: Partial<CompteV1['preferences']>): CompteV1['preferences'] {
  const d = charger();
  Object.assign(d.compte.preferences, corps);
  persister(d);
  return d.compte.preferences;
}
