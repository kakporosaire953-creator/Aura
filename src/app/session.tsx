import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

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
};

type EtatSession = {
  statut: 'chargement' | 'anonyme' | 'connecte';
  compte: Compte | null;
};

type CtxSession = EtatSession & {
  rafraichir: () => Promise<void>;
  deconnecter: () => Promise<void>;
};

const SessionCtx = createContext<CtxSession>({
  statut: 'chargement',
  compte: null,
  rafraichir: async () => {},
  deconnecter: async () => {},
});

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [etat, setEtat] = useState<EtatSession>({ statut: 'chargement', compte: null });

  const rafraichir = useCallback(async () => {
    try {
      const r = await fetch('/api/me', { credentials: 'same-origin' });
      if (r.ok) {
        const d = (await r.json()) as { compte: Compte };
        setEtat({ statut: 'connecte', compte: d.compte });
      } else {
        setEtat({ statut: 'anonyme', compte: null });
      }
    } catch {
      setEtat({ statut: 'anonyme', compte: null });
    }
  }, []);

  const deconnecter = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } finally {
      setEtat({ statut: 'anonyme', compte: null });
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
}> {
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
    };
    if (r.ok && d.compte) return { ok: true, compte: d.compte };
    return {
      ok: false,
      erreur: d.error ?? 'Le service ne répond pas.',
      code: d.code,
      detail: d.champs,
    };
  } catch {
    return { ok: false, erreur: 'Le service ne répond pas.', code: 'reseau' };
  }
}
