import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  simulationActivee,
  compteCourantSimule,
  inscrireSimule,
  connecterSimule,
  deconnecterSimule,
  onboardingSimule,
  type ResultatSimule,
} from './simulation';

/**
 * Session du compte Aura — un seul état partagé, synchronisé
 * avec l'API (/api/me). Anonyme, connecté, ou en chargement :
 * jamais d'état inventé.
 */
export type Compte = {
  email: string;
  nom: string;
  cree: string;
  onboarding: { fait: boolean; objectif: string | null };
  /** Adresse confirmée par e-mail (facultatif : non bloquant, jamais supposé). */
  emailVerifie?: boolean;
  /** Une connexion Google est-elle rattachée à ce compte ? */
  googleLie?: boolean;
  /** Un mot de passe utilisable existe-t-il ? (faux pour un compte Google seul) */
  motDePasseDefini?: boolean;
};

/**
 * Quatre états, jamais confondus :
 * - `chargement` : la session n'est pas encore vérifiée ;
 * - `connecte` : le serveur reconnaît le cookie ;
 * - `anonyme` : le serveur répond explicitement 401 ;
 * - `indisponible` : le serveur est injoignable ou son stockage est en
 *   panne — ce n'est pas un visiteur anonyme, et l'interface doit le dire.
 */
export type StatutSession = 'chargement' | 'anonyme' | 'connecte' | 'indisponible';

/**
 * Règle de confirmation d'adresse appliquée par le serveur :
 * - `obligatoire` : l'espace reste fermé tant que l'adresse n'est pas confirmée ;
 * - `impossible` : aucun e-mail ne peut partir, exiger la confirmation
 *   enfermerait tout le monde — l'interface l'affiche tel quel ;
 * - `facultative` : désactivée par l'administrateur.
 */
export type VerificationEmail = 'obligatoire' | 'impossible' | 'facultative';

type EtatSession = {
  statut: StatutSession;
  compte: Compte | null;
  motif: 'stockage' | 'reseau' | null;
  /** Le serveur a répondu 401 `session-expiree` : le dire, plutôt que « anonyme ». */
  expiree: boolean;
  /** Règle réellement appliquée, telle que le serveur la déclare. */
  verificationEmail: VerificationEmail;
};

type CtxSession = EtatSession & {
  rafraichir: () => Promise<void>;
  deconnecter: () => Promise<void>;
};

const SessionCtx = createContext<CtxSession>({
  statut: 'chargement',
  compte: null,
  motif: null,
  expiree: false,
  verificationEmail: 'obligatoire',
  rafraichir: async () => {},
  deconnecter: async () => {},
});

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [etat, setEtat] = useState<EtatSession>({
    statut: 'chargement',
    compte: null,
    motif: null,
    expiree: false,
    verificationEmail: 'obligatoire',
  });

  const rafraichir = useCallback(async () => {
    // Mode simulation : état local du navigateur, jamais présenté comme réel.
    if (simulationActivee()) {
      const c = compteCourantSimule();
      setEtat(
        c
          ? { statut: 'connecte', compte: c, motif: null, expiree: false, verificationEmail: 'facultative' }
          : { statut: 'anonyme', compte: null, motif: null, expiree: false, verificationEmail: 'facultative' },
      );
      return;
    }
    try {
      const r = await fetch('/api/me', { credentials: 'same-origin' });
      if (r.ok) {
        const d = (await r.json()) as { compte: Compte; verificationEmail?: VerificationEmail };
        setEtat({
          statut: 'connecte',
          compte: d.compte,
          motif: null,
          expiree: false,
          verificationEmail: d.verificationEmail ?? 'obligatoire',
        });
        return;
      }
      if (r.status === 401) {
        const code = await r
          .json()
          .then((d: { code?: string }) => d?.code)
          .catch(() => undefined);
        setEtat({
          statut: 'anonyme',
          compte: null,
          motif: null,
          expiree: code === 'session-expiree',
          verificationEmail: 'obligatoire',
        });
        return;
      }
      // 503 (stockage) ou toute autre erreur serveur : le service est
      // indisponible, l'utilisateur n'est pas pour autant anonyme.
      setEtat({
        statut: 'indisponible',
        compte: null,
        motif: r.status === 503 ? 'stockage' : 'reseau',
        expiree: false,
        verificationEmail: 'obligatoire',
      });
    } catch {
      setEtat({
        statut: 'indisponible',
        compte: null,
        motif: 'reseau',
        expiree: false,
        verificationEmail: 'obligatoire',
      });
    }
  }, []);

  const deconnecter = useCallback(async () => {
    if (simulationActivee()) {
      deconnecterSimule();
      setEtat({ statut: 'anonyme', compte: null, motif: null, expiree: false, verificationEmail: 'facultative' });
      return;
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } finally {
      setEtat({
        statut: 'anonyme',
        compte: null,
        motif: null,
        expiree: false,
        verificationEmail: 'obligatoire',
      });
    }
  }, []);

  useEffect(() => {
    void rafraichir();
  }, [rafraichir]);

  return (
    <SessionCtx.Provider value={{ ...etat, rafraichir, deconnecter }}>
      {children}
    </SessionCtx.Provider>
  );
};

export function useSession(): CtxSession {
  return useContext(SessionCtx);
}

/** Appel API auth : renvoie le compte ou l'erreur, sans exception. */
export async function appelerAuth(
  route: '/auth/login' | '/auth/register' | '/me/onboarding',
  corps: unknown,
  methode: 'POST' | 'PATCH' = 'POST',
): Promise<{
  ok: boolean;
  compte?: Compte;
  erreur?: string;
  code?: string;
  detail?: Record<string, string>;
  /** Code HTTP observé — 0 quand la requête n'a jamais abouti. */
  statut?: number;
  /** Résultat de l'envoi du lien de confirmation, à l'inscription. */
  envoiMail?: { ok: boolean; code?: string };
}> {
  // Mode simulation : même contrat de réponse, stockage local.
  if (simulationActivee()) {
    let res: ResultatSimule;
    if (route === '/auth/register') {
      const c = corps as { email?: string; password?: string; nom?: string };
      res = inscrireSimule(c.email ?? '', c.password ?? '', c.nom ?? '');
    } else if (route === '/auth/login') {
      const c = corps as { email?: string; password?: string };
      res = connecterSimule(c.email ?? '', c.password ?? '');
    } else {
      const c = corps as { fait?: boolean; objectif?: string };
      res = onboardingSimule(c.fait === true, c.objectif ?? '');
    }
    return res;
  }
  try {
    const r = await fetch(`/api${route}`, {
      method: methode,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corps),
    });
    const d = (await r.json().catch(() => ({}))) as {
      compte?: Compte;
      error?: string;
      code?: string;
      champs?: Record<string, string>;
      envoiMail?: { ok: boolean; code?: string };
    };
    if (r.ok && d.compte) {
      return { ok: true, compte: d.compte, ...(d.envoiMail ? { envoiMail: d.envoiMail } : {}) };
    }
    // Réponse sans notre contrat JSON (500 de la fonction, page d'erreur d'un
    // proxy) : on le dit distinctement d'une coupure réseau.
    return {
      ok: false,
      erreur: d.error ?? 'Le service ne répond pas.',
      code: d.code ?? 'serveur',
      detail: d.champs,
      statut: r.status,
    };
  } catch {
    return { ok: false, erreur: 'Le service ne répond pas.', code: 'reseau', statut: 0 };
  }
}
