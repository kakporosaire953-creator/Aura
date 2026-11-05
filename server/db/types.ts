/**
 * Entités du domaine AURA — modèle logique unique, indépendant du pilote
 * de stockage. Chaque entité appartient à un utilisateur ; les entrepôts
 * (server/db/entrepots.ts) appliquent systématiquement le périmètre
 * propriétaire. Voir docs/database/ pour le modèle relationnel documenté.
 */

export type Identifiant = string; // id opaque court (chrono + aléatoire)

/* ── Compte, profil contextuel, préférences ── */

export type Onboarding = { fait: boolean; objectif: string | null };

/** Profil contextuel — Module « AURA Local » (§6 de la mission). */
export type ProfilContextuel = {
  pays: string | null; // code ISO 2 lettres ou nom libre
  region: string | null;
  languePrincipale: 'fr' | 'en';
  languesSecondaires: string[];
  devise: string | null; // ex. XOF, EUR, USD
  fuseau: string | null; // ex. Africa/Porto-Novo
  unites: 'metriques' | 'imperiales';
  domaine: string | null; // domaine d'activité
};

export type PreferencesUtilisateur = {
  tonReponse: 'concis' | 'detaille' | 'pedagogique';
  utiliserMemoire: boolean;
  langueReponse: 'auto' | 'fr' | 'en';
};

export type Compte = {
  id: Identifiant;
  email: string;
  nom: string;
  hash: string;
  sel: string;
  cree: string;
  onboarding: Onboarding;
  profil: ProfilContextuel;
  preferences: PreferencesUtilisateur;
};

export type ComptePublic = {
  id: Identifiant;
  email: string;
  nom: string;
  cree: string;
  onboarding: Onboarding;
  profil: ProfilContextuel;
  preferences: PreferencesUtilisateur;
};

export type Session = {
  id: string; // empreinte sha256 du jeton
  userId: Identifiant;
  expire: number;
  cree: string;
};

/* ── Conversations & messages ── */

export type Conversation = {
  id: Identifiant;
  userId: Identifiant;
  projectId: Identifiant | null;
  titre: string;
  archive: boolean;
  cree: string;
  maj: string;
};

export type StatutMessage = 'envoye' | 'genere' | 'interrompu' | 'erreur';

export type Message = {
  id: Identifiant;
  conversationId: Identifiant;
  userId: Identifiant;
  role: 'user' | 'assistant' | 'system';
  contenu: string;
  statut: StatutMessage;
  cree: string;
  meta: {
    modele?: string;
    erreur?: string;
    memoiresUtilisees?: Identifiant[]; // contexte réellement envoyé au modèle
    interrompuParUtilisateur?: boolean;
  } | null;
};

/* ── Projets ── */

export type Projet = {
  id: Identifiant;
  userId: Identifiant;
  nom: string;
  description: string;
  objectif: string;
  categorie: string;
  statut: 'actif' | 'archive';
  instructions: string; // instructions spécifiques du projet (contexte)
  cree: string;
  maj: string;
};

/* ── Missions ── */

export type StatutMission = 'a_faire' | 'en_cours' | 'en_attente' | 'terminee' | 'archivee';
export type PrioriteMission = 'basse' | 'moyenne' | 'haute' | 'urgente';

export type SousTache = {
  id: Identifiant;
  titre: string;
  fait: boolean;
};

export type Mission = {
  id: Identifiant;
  userId: Identifiant;
  projectId: Identifiant | null;
  titre: string;
  description: string;
  priorite: PrioriteMission;
  statut: StatutMission;
  echeance: string | null; // ISO date
  ordre: number;
  sousTaches: SousTache[];
  notes: string;
  cree: string;
  maj: string;
};

/* ── Mémoire ── */

export type TypeMemoire =
  | 'preference'
  | 'contexte_personnel'
  | 'preference_reponse'
  | 'professionnel'
  | 'instruction_projet'
  | 'temporaire';

export type Memoire = {
  id: Identifiant;
  userId: Identifiant;
  projectId: Identifiant | null;
  type: TypeMemoire;
  contenu: string;
  actif: boolean;
  cree: string;
  maj: string;
};

/* ── Recherches (Explorer) ── */

export type Recherche = {
  id: Identifiant;
  userId: Identifiant;
  projectId: Identifiant | null;
  requete: string;
  synthese: string;
  statut: 'terminee' | 'sans_resultat' | 'erreur';
  erreur: string | null;
  cree: string;
};

export type SourceRecherche = {
  id: Identifiant;
  rechercheId: Identifiant;
  titre: string;
  url: string;
  extrait: string;
  dateSource: string | null;
};

/* ── Studio ── */

export type TypeCreation =
  | 'document'
  | 'resume'
  | 'rapport'
  | 'texte_professionnel'
  | 'publication'
  | 'presentation'
  | 'code'
  | 'plan'
  | 'creatif';

export type VersionCreation = {
  id: Identifiant;
  numero: number;
  contenu: string;
  note: string; // « génération initiale », « révision : … »
  cree: string;
};

export type Creation = {
  id: Identifiant;
  userId: Identifiant;
  projectId: Identifiant | null;
  type: TypeCreation;
  titre: string;
  instruction: string;
  statut: 'en_attente' | 'terminee' | 'erreur';
  erreur: string | null;
  versions: VersionCreation[]; // historique des versions, ordre croissant
  cree: string;
  maj: string;
};

/* ── Télémétrie technique (sans contenu privé) ── */

export type EvenementUsage = {
  id: Identifiant;
  userId: Identifiant;
  genre: 'chat' | 'recherche' | 'creation' | 'mission_aide' | 'autre';
  cree: string;
  meta: Record<string, number | string | boolean> | null;
};

/* ── Agrégat par utilisateur ── */

export const SCHEMA_VERSION = 2;

export type DonneesUtilisateur = {
  schemaVersion: number;
  conversations: Conversation[];
  messages: Message[];
  projets: Projet[];
  missions: Mission[];
  memoires: Memoire[];
  recherches: Recherche[];
  sources: SourceRecherche[];
  creations: Creation[];
  evenements: EvenementUsage[];
};

export function donneesVides(): DonneesUtilisateur {
  return {
    schemaVersion: SCHEMA_VERSION,
    conversations: [],
    messages: [],
    projets: [],
    missions: [],
    memoires: [],
    recherches: [],
    sources: [],
    creations: [],
    evenements: [],
  };
}
