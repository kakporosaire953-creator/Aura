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

/** Suspension administrative d'un compte (jamais une suppression). */
export type Bannissement = {
  le: string;
  motif: string | null;
  /** Adresse de l'administrateur qui a prononcé la suspension. */
  par: string;
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
  /**
   * Vérification d'adresse — champs optionnels : les comptes créés avant
   * la mission 08 n'en ont pas et restent pleinement utilisables.
   * Absent = non vérifié, mais jamais bloquant (décision produit : la
   * vérification est une information, pas une condition d'accès).
   */
  emailVerifie?: boolean;
  emailVerifieLe?: string | null;
  /**
   * Identifiant stable du compte Google (`sub`). Absent = compte ouvert par
   * mot de passe. Un compte ne peut être rattaché qu'à un seul Google.
   */
  googleSub?: string;
  /**
   * `false` pour un compte créé via Google sans mot de passe choisi : la
   * connexion par mot de passe y est impossible tant qu'une réinitialisation
   * n'en a pas défini un. Absent = vrai (comptes historiques).
   */
  motDePasseDefini?: boolean;
  /** Présent = compte suspendu : connexion refusée, sessions révoquées. */
  bannissement?: Bannissement;
};

export type ComptePublic = {
  id: Identifiant;
  email: string;
  nom: string;
  cree: string;
  onboarding: Onboarding;
  profil: ProfilContextuel;
  preferences: PreferencesUtilisateur;
  emailVerifie: boolean;
  /** Une connexion Google est-elle rattachée à ce compte ? */
  googleLie: boolean;
  /** Un mot de passe utilisable existe-t-il ? (faux pour un compte Google seul) */
  motDePasseDefini: boolean;
  /** Compte suspendu par l'administration. */
  banni: boolean;
};

export type Session = {
  id: string; // empreinte sha256 du jeton
  userId: Identifiant;
  expire: number;
  cree: string;
  /**
   * Appareil déclaré à la connexion (en-tête `User-Agent`, tronqué).
   * Information déclarative, jamais une identification : elle sert
   * seulement à reconnaître une session dans la liste.
   */
  agent?: string | null;
  /** Dernière requête authentifiée, mise à jour au plus une fois par 5 min. */
  derniereActivite?: number;
};

/** Entrée du journal d'administration (qui a fait quoi, quand, sur qui). */
export type JournalAdmin = {
  id: string;
  le: string;
  /** Adresse de l'administrateur — jamais un jeton ni un secret. */
  par: string;
  action: 'bannir' | 'debannir' | 'revoquer-sessions' | 'supprimer';
  cible: string;
  motif: string | null;
};

/* ── Jetons à usage unique (vérification d'e-mail, réinitialisation) ── */

export type TypeJeton = 'verification' | 'reinitialisation';

/**
 * Jeton de vérification ou de réinitialisation.
 *
 * `id` est l'empreinte SHA-256 du jeton brut : la valeur transmise par
 * e-mail n'existe nulle part dans le stockage, ni dans les journaux.
 */
export type Jeton = {
  id: string;
  type: TypeJeton;
  userId: Identifiant;
  cree: number;
  expire: number;
  utiliseLe: string | null;
  /** Empreinte de l'adresse au moment de l'émission (changement d'adresse = invalidation). */
  empreinteEmail: string;
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

/**
 * Image jointe à un message. `data` est une data URL (`data:image/png;base64,…`)
 * déjà réduite côté navigateur : le serveur n'accepte ni fichier brut ni URL
 * distante.
 */
export type PieceJointe = {
  nom: string;
  type: string;
  taille: number;
  data: string;
};

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
    piecesJointes?: PieceJointe[];
    /** Mode demandé par l'utilisateur (routage), jamais un nom de fournisseur. */
    mode?: string;
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
  genre: 'chat' | 'recherche' | 'creation' | 'mission_aide' | 'ia' | 'autre';
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
