/**
 * Aura installable (PWA) — ce qui vit côté navigateur.
 *
 * Trois choses, et rien de magique :
 *  - l'enregistrement du service worker (coque en cache, données jamais) ;
 *  - l'invite d'installation du navigateur (`beforeinstallprompt`), qui
 *    n'existe que sur Chromium : ailleurs, on explique le geste ;
 *  - la mise à jour, proposée mais **jamais imposée** — personne ne se fait
 *    recharger au milieu d'une phrase.
 *
 * Aucun de ces mécanismes n'est requis pour utiliser Aura : sans service
 * worker, le site fonctionne exactement comme avant, simplement sans mode
 * hors ligne ni installation.
 */
import { useEffect, useState } from 'react';

type InviteInstallation = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export type EtatInstallation = 'installee' | 'installable' | 'manuelle';
export type Plateforme = 'ios' | 'android' | 'ordinateur';

/** L'application tourne-t-elle déjà comme une application installée ? */
export function estInstallee(): boolean {
  if (typeof window === 'undefined') return false;
  const autonome = window.matchMedia?.('(display-mode: standalone)')?.matches === true;
  const ios =
    (window.navigator as unknown as { standalone?: boolean } | undefined)?.standalone === true;
  return autonome || ios;
}

/** Famille d'appareil — sert uniquement à choisir la bonne phrase d'aide. */
export function plateformeCourante(): Plateforme {
  if (typeof navigator === 'undefined') return 'ordinateur';
  const ua = navigator.userAgent || '';
  // iPad récent se présente comme un Mac : le tactile le trahit.
  const ipad = /Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1;
  if (/iPhone|iPad|iPod/.test(ua) || ipad) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'ordinateur';
}

/**
 * État d'installation + déclencheur.
 * `installer()` ne fait rien si le navigateur n'a pas émis d'invite : c'est
 * un choix du navigateur, pas un échec de l'application.
 */
export function useInstallation(): {
  etat: EtatInstallation;
  installer: () => Promise<'acceptee' | 'refusee' | 'indisponible'>;
  plateforme: Plateforme;
} {
  const [invite, setInvite] = useState<InviteInstallation | null>(null);
  const [installee, setInstallee] = useState(estInstallee);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const surInvite = (evenement: Event) => {
      evenement.preventDefault();
      setInvite(evenement as InviteInstallation);
    };
    const surInstallation = () => {
      setInstallee(true);
      setInvite(null);
    };
    const media = window.matchMedia?.('(display-mode: standalone)');
    const surChangementAffichage = (e: MediaQueryListEvent) => {
      if (e.matches) setInstallee(true);
    };

    window.addEventListener('beforeinstallprompt', surInvite);
    window.addEventListener('appinstalled', surInstallation);
    media?.addEventListener?.('change', surChangementAffichage);

    return () => {
      window.removeEventListener('beforeinstallprompt', surInvite);
      window.removeEventListener('appinstalled', surInstallation);
      media?.removeEventListener?.('change', surChangementAffichage);
    };
  }, []);

  const etat: EtatInstallation = installee ? 'installee' : invite ? 'installable' : 'manuelle';

  const installer = async (): Promise<'acceptee' | 'refusee' | 'indisponible'> => {
    if (!invite) return 'indisponible';
    await invite.prompt();
    const choix = await invite.userChoice;
    setInvite(null);
    return choix.outcome === 'accepted' ? 'acceptee' : 'refusee';
  };

  return { etat, installer, plateforme: plateformeCourante() };
}

/* ───────────────────────── Service worker ───────────────────────── */

let enregistrement: ServiceWorkerRegistration | null = null;
let miseAJourPrete = false;
let rechargementArme = false;
let derniereVerification = 0;
const ecouteurs = new Set<() => void>();

function signaler(): void {
  for (const ecouteur of ecouteurs) ecouteur();
}

/**
 * Enregistre `/sw.js`. À appeler **en production uniquement** (le serveur de
 * développement sert des modules à la volée ; un cache y serait nuisible).
 */
export function enregistrerServiceWorker(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  if (typeof window === 'undefined') return;

  const demarrer = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      enregistrement = reg;

      if (reg.waiting && navigator.serviceWorker.controller) {
        miseAJourPrete = true;
        signaler();
      }

      reg.addEventListener('updatefound', () => {
        const nouveau = reg.installing;
        if (!nouveau) return;
        nouveau.addEventListener('statechange', () => {
          // `controller` existant ⇒ ce n'est pas la première installation,
          // c'est une mise à jour : on la propose.
          if (nouveau.state === 'installed' && navigator.serviceWorker.controller) {
            miseAJourPrete = true;
            signaler();
          }
        });
      });

      const verifier = () => {
        const maintenant = Date.now();
        if (maintenant - derniereVerification < 30 * 60 * 1000) return;
        derniereVerification = maintenant;
        void reg.update().catch(() => undefined);
      };
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') verifier();
      });
    } catch {
      /* Aucun service worker : Aura reste utilisable, sans mode hors ligne. */
    }
  };

  // Un module différé s'exécute après l'analyse du document : inutile
  // d'attendre `load`, sauf si le document est encore en cours de lecture.
  if (document.readyState === 'loading') {
    window.addEventListener('load', () => void demarrer(), { once: true });
  } else {
    void demarrer();
  }
}

/** Active la version en attente et recharge — sur demande explicite. */
export function appliquerMiseAJour(): void {
  const enAttente = enregistrement?.waiting;
  if (!enAttente) {
    window.location.reload();
    return;
  }
  if (!rechargementArme) {
    rechargementArme = true;
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
  }
  enAttente.postMessage({ type: 'ACTIVER' });
}

/** Une nouvelle version attend-elle d'être activée ? */
export function useMiseAJour(): { disponible: boolean; appliquer: () => void } {
  const [disponible, setDisponible] = useState(miseAJourPrete);

  useEffect(() => {
    const ecouteur = () => setDisponible(miseAJourPrete);
    ecouteurs.add(ecouteur);
    ecouteur();
    return () => {
      ecouteurs.delete(ecouteur);
    };
  }, []);

  return { disponible, appliquer: appliquerMiseAJour };
}

/** Réservé aux tests : remet l'état du module à zéro. */
export function _reinitialiserPwa(): void {
  enregistrement = null;
  miseAJourPrete = false;
  rechargementArme = false;
  derniereVerification = 0;
  ecouteurs.clear();
}
