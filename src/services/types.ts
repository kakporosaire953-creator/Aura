/**
 * Types partagés côté frontend — miroirs des contrats de l'API v1
 * (server/db/types.ts). Le mode simulation utilise exactement les
 * mêmes formes pour permettre le branchement du réel sans refaire les écrans.
 */

export type Identifiant = string;

export type Onboarding = { fait: boolean; objectif: string | null };

export type ProfilContextuel = {
  pays: string | null;
  region: string | null;
  languePrincipale: 'fr' | 'en';
  languesSecondaires: string[];
  devise: string | null;
  fuseau: string | null;
  unites: 'metriques' | 'imperiales';
  domaine: string | null;
};

export type PreferencesUtilisateur = {
  tonReponse: 'concis' | 'detaille' | 'pedagogique';
  utiliserMemoire: boolean;
  langueReponse: 'auto' | 'fr' | 'en';
};

export type CompteV1 = {
  id: Identifiant;
  email: string;
  nom: string;
  cree: string;
  onboarding: Onboarding;
  profil: ProfilContextuel;
  preferences: PreferencesUtilisateur;
  /** Adresse confirmée par e-mail — jamais bloquant pour utiliser le compte.
   *  Absent = non confirmé (comptes créés avant la vérification). */
  emailVerifie?: boolean;
  /** Connexion Google rattachée au compte. */
  googleLie?: boolean;
  /** Faux quand le compte a été ouvert via Google sans mot de passe choisi. */
  motDePasseDefini?: boolean;
};

/** Session ouverte sur le compte, telle que présentée à son propriétaire. */
export type SessionActive = {
  id: string;
  libelle: string;
  courante: boolean;
  cree: string;
  derniereActivite: string;
  expire: string;
};

export type Conversation = {
  id: Identifiant;
  userId?: Identifiant;
  projectId: Identifiant | null;
  titre: string;
  archive: boolean;
  cree: string;
  maj: string;
};

export type StatutMessage = 'envoye' | 'genere' | 'interrompu' | 'erreur';

/** Image jointe à un message (data URL déjà réduite côté navigateur). */
export type PieceJointeChat = {
  nom: string;
  type: string;
  taille: number;
  data: string;
};

/** Modes de travail proposés — jamais un nom de fournisseur ou de modèle. */
export type ModeChat = 'conversation' | 'raisonnement' | 'code' | 'recherche';

export type MessageChat = {
  id?: Identifiant;
  conversationId?: Identifiant;
  role: 'user' | 'assistant' | 'system';
  content: string;
  contenu?: string;
  statut?: StatutMessage;
  cree?: string;
  meta?: {
    modele?: string;
    erreur?: string;
    memoiresUtilisees?: Identifiant[];
    interrompuParUtilisateur?: boolean;
    piecesJointes?: PieceJointeChat[];
    mode?: string;
  } | null;
};

export type Projet = {
  id: Identifiant;
  nom: string;
  description: string;
  objectif: string;
  categorie: string;
  statut: 'actif' | 'archive';
  instructions: string;
  cree: string;
  maj: string;
};

export type StatutMission = 'a_faire' | 'en_cours' | 'en_attente' | 'terminee' | 'archivee';
export type PrioriteMission = 'basse' | 'moyenne' | 'haute' | 'urgente';

export type SousTache = { id: Identifiant; titre: string; fait: boolean };

export type Mission = {
  id: Identifiant;
  projectId: Identifiant | null;
  titre: string;
  description: string;
  priorite: PrioriteMission;
  statut: StatutMission;
  echeance: string | null;
  ordre: number;
  sousTaches: SousTache[];
  notes: string;
  cree: string;
  maj: string;
};

export type TypeMemoire =
  | 'preference'
  | 'contexte_personnel'
  | 'preference_reponse'
  | 'professionnel'
  | 'instruction_projet'
  | 'temporaire';

export type Memoire = {
  id: Identifiant;
  projectId: Identifiant | null;
  type: TypeMemoire;
  contenu: string;
  actif: boolean;
  cree: string;
  maj: string;
};

export type Recherche = {
  id: Identifiant;
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
  note: string;
  cree: string;
};

export type Creation = {
  id: Identifiant;
  projectId: Identifiant | null;
  type: TypeCreation;
  titre: string;
  instruction: string;
  statut: 'en_attente' | 'terminee' | 'erreur';
  erreur: string | null;
  versions: VersionCreation[];
  cree: string;
  maj: string;
};

export type Capabilities = {
  comptes: boolean;
  persistance: { ok: boolean; mode: string; raison?: string };
  assistant: { ok: boolean; streaming: boolean; sortieStructuree: boolean; raison?: string };
  recherche: { ok: boolean; raison?: string };
  studio: { ok: boolean; raison?: string };
  images: { ok: boolean; raison?: string };
  fichiers: { ok: boolean; raison?: string };
};

export type PropositionMission = {
  titre: string;
  description: string;
  priorite: PrioriteMission;
  echeance: string | null;
  sousTaches: string[];
};
