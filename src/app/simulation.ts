/**
 * Mode simulation — pour parcourir toutes les interfaces du produit
 * sans API réelle. TOUT est stocké localement dans le navigateur et
 * clairement étiqueté comme simulé (bannière + badges). Rien n'est
 * jamais présenté comme réel.
 *
 * Les formes de données imitent les contrats de l'API réelle
 * (server/api.ts) pour pouvoir brancher les vraies APIs ensuite
 * sans refaire les écrans.
 */
import type { Compte } from './session';

const CLE_MODE = 'aura_simulation';
const CLE_COMPTES = 'aura_sim_comptes';
const CLE_SESSION = 'aura_sim_session';
const CLE_ONBOARDING = 'aura_sim_onboarding';

/* ── Activation ── */

export function simulationActivee(): boolean {
  try {
    const v = localStorage.getItem(CLE_MODE);
    return v !== '0'; // activée par défaut pendant la phase de démonstration
  } catch {
    return true;
  }
}

export function definirSimulation(active: boolean): void {
  try {
    localStorage.setItem(CLE_MODE, active ? '1' : '0');
  } catch {
    /* stockage indisponible */
  }
  window.location.reload();
}

/* ── Comptes simulés (localStorage uniquement) ── */

type CompteSimule = Compte & { motDePasse: string };

function lireComptes(): CompteSimule[] {
  try {
    return JSON.parse(localStorage.getItem(CLE_COMPTES) ?? '[]') as CompteSimule[];
  } catch {
    return [];
  }
}

function ecrireComptes(comptes: CompteSimule[]): void {
  localStorage.setItem(CLE_COMPTES, JSON.stringify(comptes));
}

function versPublicSimule(c: CompteSimule): Compte {
  const { motDePasse: _ignore, ...compte } = c;
  return compte;
}

export type ResultatSimule = {
  ok: boolean;
  compte?: Compte;
  erreur?: string;
  code?: string;
  detail?: Record<string, string>;
};

export function inscrireSimule(email: string, password: string, nom: string): ResultatSimule {
  const adresse = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(adresse)) {
    return { ok: false, erreur: 'Saisie invalide.', code: 'validation', detail: { email: 'invalide' } };
  }
  if (password.length < 8) {
    return { ok: false, erreur: 'Saisie invalide.', code: 'validation', detail: { password: 'court' } };
  }
  const comptes = lireComptes();
  if (comptes.some((c) => c.email === adresse)) {
    return { ok: false, erreur: 'Un compte existe déjà avec cette adresse.', code: 'existe' };
  }
  const compte: CompteSimule = {
    email: adresse,
    nom: nom.trim(),
    cree: new Date().toISOString(),
    onboarding: { fait: false, objectif: null },
    motDePasse: password,
  };
  comptes.push(compte);
  ecrireComptes(comptes);
  localStorage.setItem(CLE_SESSION, adresse);
  return { ok: true, compte: versPublicSimule(compte) };
}

export function connecterSimule(email: string, password: string): ResultatSimule {
  const adresse = email.trim().toLowerCase();
  const compte = lireComptes().find((c) => c.email === adresse && c.motDePasse === password);
  if (!compte) {
    return { ok: false, erreur: 'Identifiants incorrects.', code: 'identifiants' };
  }
  localStorage.setItem(CLE_SESSION, adresse);
  return { ok: true, compte: versPublicSimule(compte) };
}

export function deconnecterSimule(): void {
  localStorage.removeItem(CLE_SESSION);
}

export function compteCourantSimule(): Compte | null {
  const adresse = localStorage.getItem(CLE_SESSION);
  if (!adresse) return null;
  const compte = lireComptes().find((c) => c.email === adresse);
  return compte ? versPublicSimule(compte) : null;
}

export function onboardingSimule(fait: boolean, objectif: string): ResultatSimule {
  const adresse = localStorage.getItem(CLE_SESSION);
  const comptes = lireComptes();
  const compte = comptes.find((c) => c.email === adresse);
  if (!compte) return { ok: false, erreur: 'non connecté', code: 'anonyme' };
  compte.onboarding = { fait, objectif: objectif || null };
  ecrireComptes(comptes);
  return { ok: true, compte: versPublicSimule(compte) };
}

/** Ouvre instantanément une session de démonstration (bouton « Voir la démonstration »). */
export function ouvrirDemo(): void {
  const adresse = 'demo@aura.local';
  const comptes = lireComptes();
  if (!comptes.some((c) => c.email === adresse)) {
    comptes.push({
      email: adresse,
      nom: 'Compte de démonstration',
      cree: new Date().toISOString(),
      onboarding: { fait: true, objectif: 'Créer des visuels' },
      motDePasse: 'demonstration',
    });
    ecrireComptes(comptes);
  }
  localStorage.setItem(CLE_SESSION, adresse);
}

/* ── Chat simulé ── */

const REPONSES_FR = [
  "Voici une réponse de démonstration : en mode simulation, je montre comment la conversation s'affichera une fois les vraies APIs branchées. L'interface, elle, est déjà définitive.",
  'Bien sûr. Dans la vraie version, cette réponse viendrait du moteur Gemini côté serveur — la mise en page, les bulles et le rythme seront exactement ceux que vous voyez ici.',
  'Exemple simulé : « Clarifier une idée, c\'est d\'abord nommer le problème, puis la personne qui le vit, puis le résultat attendu. » — contenu de démonstration.',
  'Je simule ici une réponse plus longue pour que vous puissiez juger le rendu des paragraphes, la largeur des bulles et le confort de lecture sur cette interface.\n\nLa vraie réponse sera générée en direct.',
  'Réponse simulée : tout ce que vous voyez dans cette conversation est local à votre navigateur, rien n\'est envoyé nulle part.',
  'Dernier point simulé : vous pourrez poser des questions suivies, garder le contexte de la conversation, et retrouver l\'historique — dès que l\'API réelle sera branchée.',
];

const REPONSES_EN = [
  'Here is a demo answer: in simulation mode, I show how the conversation will look once the real APIs are wired. The interface itself is final.',
  'Sure. In the real version, this answer would come from the Gemini engine server-side — the layout, bubbles and pacing will be exactly what you see here.',
  'Simulated example: "Clarifying an idea starts with naming the problem, then who lives it, then the expected outcome." — demo content.',
  'I am simulating a longer answer here so you can judge paragraph rendering, bubble width and reading comfort on this interface.\n\nThe real answer will be generated live.',
  'Simulated answer: everything in this conversation stays in your browser, nothing is sent anywhere.',
  'Final simulated point: you will be able to ask follow-up questions, keep conversation context and find history — as soon as the real API is wired.',
];

export function reponseSimulee(nbMessages: number, langue: string): string {
  const liste = langue === 'en' ? REPONSES_EN : REPONSES_FR;
  return liste[nbMessages % liste.length];
}

/* ── Explore : résultats de démonstration ── */

export type ResultatExplore = {
  titre: string;
  source: string;
  date: string;
  extrait: string;
  motCle: string;
};

export const RESULTATS_EXPLORE: ResultatExplore[] = [
  {
    titre: 'Méthodes de cadrage rapide pour les projets créatifs',
    source: 'Revue Studio — démonstration',
    date: '2026-09',
    extrait:
      "Un cadrage court (problème, public, résultat attendu) réduit les allers-retours de moitié. Contenu de démonstration pour l'aperçu de l'interface.",
    motCle: 'cadrage',
  },
  {
    titre: 'De l\'idée au résultat : études de cas d\'outils unifiés',
    source: 'Cahier produit — démonstration',
    date: '2026-07',
    extrait:
      "Les plateformes qui tiennent un seul fil de bout en bout montrent des taux d'achèvement supérieurs. Aperçu simulé d'un extrait sourcé.",
    motCle: 'fil',
  },
  {
    titre: 'Concevoir des interfaces qui respirent',
    source: 'Atelier design — démonstration',
    date: '2026-05',
    extrait:
      "Espacements, rythmes, hiérarchie : les détails qui font qu'un écran se lit seul. Résultat de démonstration, sources fictives.",
    motCle: 'design',
  },
  {
    titre: 'Automatiser sans perdre le geste humain',
    source: 'Note de recherche — démonstration',
    date: '2026-03',
    extrait:
      "L'automatisation utile laisse les décisions à l'humain et prend en charge la répétition. Contenu simulé pour illustrer la carte de résultat.",
    motCle: 'automatisation',
  },
  {
    titre: 'Organiser des missions en équipe légère',
    source: 'Journal produit — démonstration',
    date: '2026-01',
    extrait:
      "Des missions courtes, visibles, avec un état clair : la base d'un espace de travail vivant. Données de démonstration.",
    motCle: 'missions',
  },
];

/* ── Missions : tableau de démonstration ── */

export type MissionSimulee = {
  titre: string;
  colonne: 0 | 1 | 2;
  etiquettes: string[];
  progression: number;
};

export const MISSIONS_INITIALES: MissionSimulee[] = [
  {
    titre: 'Préparer le lancement de la vitrine',
    colonne: 2,
    etiquettes: ['Vitrine', 'Priorité'],
    progression: 100,
  },
  {
    titre: 'Rédiger la page documentation',
    colonne: 1,
    etiquettes: ['Contenu'],
    progression: 55,
  },
  {
    titre: 'Explorer les options d\'onboarding',
    colonne: 1,
    etiquettes: ['Produit'],
    progression: 30,
  },
  {
    titre: 'Collecter les retours de la démo',
    colonne: 0,
    etiquettes: ['Recherche'],
    progression: 0,
  },
  {
    titre: 'Imaginer les modèles du Studio',
    colonne: 0,
    etiquettes: ['Studio', 'Idées'],
    progression: 0,
  },
];
