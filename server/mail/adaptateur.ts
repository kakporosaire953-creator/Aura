/**
 * Envoi d'e-mails transactionnels — transport.
 *
 * Un seul fournisseur configurable par variable d'environnement, appelé en
 * REST (aucun paquet ajouté au projet). Rien n'est simulé : sans
 * configuration complète, `envoyer` refuse et l'appelant répond 503.
 *
 * Règles tenues :
 * - aucun secret ne sort du serveur ;
 * - aucune valeur sensible dans les journaux (ni jeton, ni contenu) ;
 * - délai maximal court, un seul essai (pas de file d'attente) ;
 * - l'expéditeur et l'origine des liens viennent de la configuration,
 *   jamais d'un en-tête fourni par la requête.
 */

export type MessageMail = {
  a: string;
  sujet: string;
  texte: string;
  html: string;
};

export type ResultatEnvoi =
  | { ok: true }
  | { ok: false; raison: string; code: 'mail-indisponible' | 'mail-refuse' };

type Configuration = {
  fournisseur: string;
  cle: string;
  expediteur: string;
  reponse: string | null;
  base: string;
  delaiMs: number;
};

const BASE_PAR_DEFAUT = 'https://api.resend.com';

function nettoie(valeur: string | undefined): string {
  return (valeur ?? '').trim();
}

function delai(): number {
  const brut = Number(process.env.AURA_MAIL_TIMEOUT_MS);
  if (!Number.isFinite(brut)) return 8000;
  return Math.min(20000, Math.max(1000, Math.floor(brut)));
}

/**
 * Origine publique utilisée pour construire les liens des e-mails.
 * Doit être déclarée : un lien ne se construit jamais à partir de l'en-tête
 * `Host` de la requête (usurpation triviale sinon).
 */
export function originePublique(): string | null {
  const brut = nettoie(process.env.AURA_PUBLIC_ORIGIN);
  if (!brut) return null;
  let url: URL;
  try {
    url = new URL(brut);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.username || url.password) return null;
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol === 'http:' && !local) return null;
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
}

/** Configuration effective, ou la raison précise de son absence. */
export function configurationMail(): { ok: true; config: Configuration } | { ok: false; raison: string } {
  const fournisseur = nettoie(process.env.AURA_MAIL_PROVIDER).toLowerCase();
  const cle = nettoie(process.env.AURA_MAIL_API_KEY);
  const expediteur = nettoie(process.env.AURA_MAIL_FROM);
  const reponse = nettoie(process.env.AURA_MAIL_REPLY_TO);
  const base = nettoie(process.env.AURA_MAIL_API_URL) || BASE_PAR_DEFAUT;

  if (!fournisseur) return { ok: false, raison: "L'envoi d'e-mails n'est pas configuré sur cet environnement." };
  if (fournisseur !== 'resend') {
    return { ok: false, raison: "Fournisseur d'e-mails non pris en charge sur cet environnement." };
  }
  if (!cle) return { ok: false, raison: "L'envoi d'e-mails n'est pas configuré sur cet environnement." };
  if (!expediteur || !/^[^@\s]+@[^@\s]+\.[^@\s]+$|^.+\s<[^@\s]+@[^@\s]+>$/.test(expediteur)) {
    return { ok: false, raison: "L'expéditeur des e-mails n'est pas configuré correctement." };
  }
  if (!originePublique()) {
    return { ok: false, raison: "L'origine publique des liens n'est pas configurée correctement." };
  }
  try {
    new URL(base);
  } catch {
    return { ok: false, raison: "Le point d'entrée du fournisseur d'e-mails est invalide." };
  }

  return {
    ok: true,
    config: {
      fournisseur,
      cle,
      expediteur,
      reponse: reponse || null,
      base: base.replace(/\/+$/, ''),
      delaiMs: delai(),
    },
  };
}

/** L'e-mail est-il réellement utilisable ? (jamais supposé, toujours vérifié) */
export function mailConfigure(): boolean {
  return configurationMail().ok;
}

/** Raison lisible quand l'envoi n'est pas possible (pour /status et les routes). */
export function raisonMailIndisponible(): string {
  const c = configurationMail();
  return c.ok ? '' : c.raison;
}

/**
 * Envoie un message. Ne lève jamais : l'appelant décide de la réponse HTTP.
 * Aucun contenu, aucune adresse et aucun jeton n'est écrit dans les journaux.
 */
export async function envoyer(message: MessageMail): Promise<ResultatEnvoi> {
  const etat = configurationMail();
  if (!etat.ok) return { ok: false, raison: etat.raison, code: 'mail-indisponible' };

  const { config } = etat;
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), config.delaiMs);

  try {
    const r = await fetch(`${config.base}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.cle}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.expediteur,
        to: [message.a],
        subject: message.sujet,
        html: message.html,
        text: message.texte,
        ...(config.reponse ? { reply_to: config.reponse } : {}),
      }),
      signal: controleur.signal,
    });

    if (!r.ok) {
      // Seul le statut est journalisé : jamais le corps, jamais l'adresse.
      console.error(`[mail] envoi refusé par le fournisseur (${r.status}).`);
      return { ok: false, raison: "L'envoi de l'e-mail a échoué.", code: 'mail-refuse' };
    }
    return { ok: true };
  } catch (e) {
    const interrompu = e instanceof Error && e.name === 'AbortError';
    console.error(
      interrompu ? '[mail] délai dépassé, envoi abandonné.' : '[mail] fournisseur injoignable.',
    );
    return {
      ok: false,
      raison: interrompu ? "Le service d'e-mails ne répond pas." : "Le service d'e-mails est injoignable.",
      code: 'mail-refuse',
    };
  } finally {
    clearTimeout(minuteur);
  }
}
