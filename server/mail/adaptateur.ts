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
  | {
      ok: false;
      raison: string;
      code: 'mail-indisponible' | 'mail-refuse';
      /** Statut HTTP du fournisseur — pour le diagnostic, jamais pour l'UI. */
      statut?: number;
    };

type Fournisseur = 'resend' | 'brevo';

type Configuration = {
  fournisseur: Fournisseur;
  cle: string;
  expediteur: string;
  reponse: string | null;
  base: string;
  delaiMs: number;
};

/**
 * Points d'entrée par fournisseur. `AURA_MAIL_API_URL` les remplace, mais
 * seulement par une URL complète : on ne devine jamais un sous-chemin (une
 * URL doublée du type /emails/emails a déjà coûté un diagnostic).
 */
const BASES: Record<Fournisseur, string> = {
  resend: 'https://api.resend.com',
  brevo: 'https://api.brevo.com/v3',
};

const FOURNISSEURS: Fournisseur[] = ['resend', 'brevo'];

/**
 * « AURA <bonjour@domaine.tld> » → { nom: 'AURA', email: 'bonjour@domaine.tld' }.
 * Brevo attend l'expéditeur en deux champs séparés.
 */
function separerExpediteur(expediteur: string): { nom: string; email: string } {
  const m = expediteur.match(/^\s*(.*?)\s*<([^@\s>]+@[^@\s>]+)>\s*$/);
  if (m) return { nom: m[1] || 'AURA', email: m[2] };
  return { nom: 'AURA', email: expediteur.trim() };
}

/** Domaine de l'expéditeur, jamais l'adresse complète (journaux sobres). */
function domaineExpediteur(expediteur: string): string {
  const m = expediteur.match(/@([^@>\s]+)/);
  return m ? m[1] : '(illisible)';
}

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
  const brut = nettoie(process.env.AURA_MAIL_PROVIDER).toLowerCase();
  const cle = nettoie(process.env.AURA_MAIL_API_KEY);
  const expediteur = nettoie(process.env.AURA_MAIL_FROM);
  const reponse = nettoie(process.env.AURA_MAIL_REPLY_TO);

  if (!brut) return { ok: false, raison: "L'envoi d'e-mails n'est pas configuré sur cet environnement." };
  if (!FOURNISSEURS.includes(brut as Fournisseur)) {
    return { ok: false, raison: "Fournisseur d'e-mails non pris en charge sur cet environnement." };
  }
  const fournisseur = brut as Fournisseur;
  const base = nettoie(process.env.AURA_MAIL_API_URL) || BASES[fournisseur];
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
 * Requête propre à chaque fournisseur. Deux API, deux contrats — mais une
 * seule règle : aucun secret ne sort d'ici, et l'adresse de l'expéditeur ne
 * vient que de la configuration.
 */
function requeteFournisseur(
  config: Configuration,
  message: MessageMail,
  signal: AbortSignal,
): { url: string; init: RequestInit } {
  if (config.fournisseur === 'brevo') {
    const expediteur = separerExpediteur(config.expediteur);
    return {
      url: `${config.base}/smtp/email`,
      init: {
        method: 'POST',
        headers: { 'api-key': config.cle, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { email: expediteur.email, name: expediteur.nom },
          to: [{ email: message.a }],
          subject: message.sujet,
          htmlContent: message.html,
          textContent: message.texte,
          ...(config.reponse ? { replyTo: { email: config.reponse } } : {}),
        }),
        signal,
      },
    };
  }
  return {
    url: `${config.base}/emails`,
    init: {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.cle}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: config.expediteur,
        to: [message.a],
        subject: message.sujet,
        html: message.html,
        text: message.texte,
        ...(config.reponse ? { reply_to: config.reponse } : {}),
      }),
      signal,
    },
  };
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
    const { url, init } = requeteFournisseur(config, message, controleur.signal);
    const r = await fetch(url, init);

    if (!r.ok) {
      // Le statut et le message public du fournisseur sont journalisés
      // (« domaine non vérifié », « quota dépassé », « clé invalide »…),
      // après retrait de toute adresse : c'est ce qui permet à l'exploitant
      // de comprendre un refus sans jamais exposer un destinataire.
      let detail = '';
      try {
        const corps = (await r.json()) as { message?: unknown; name?: unknown };
        detail = String(corps?.message ?? corps?.name ?? '').slice(0, 200);
      } catch {
        /* corps absent ou illisible : le statut suffit */
      }
      const sansAdresses = detail.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[adresse]');
      // Ligne de diagnostic complète, sans secret : le point d'entrée (une
      // URL doublée du type /emails/emails se voit tout de suite), le domaine
      // expéditeur (à vérifier chez le fournisseur) et le message public.
      console.error(
        `[mail] envoi refusé (${r.status}) — endpoint=${config.base}/emails` +
          ` — domaine-expediteur=${domaineExpediteur(config.expediteur)}` +
          (sansAdresses ? ` — ${sansAdresses}` : ''),
      );
      return {
        ok: false,
        raison: "L'envoi de l'e-mail a échoué.",
        code: 'mail-refuse',
        statut: r.status,
      };
    }
    // Trace utile : un envoi accepté se distingue d'un envoi silencieux.
    console.log(`[mail] envoi accepté — fournisseur=${config.fournisseur} — endpoint=${url}`);
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
