/**
 * Collecte d'URL — protections réelles, pas décoratives.
 *
 * Trois verrous, et ils s'appliquent à **chaque saut de redirection** :
 *  1. le schéma (http/https uniquement), l'absence d'identifiants dans l'URL
 *     et le port (80/443) ;
 *  2. l'hôte doit appartenir au **catalogue de sources actives** : sans
 *     autorisation explicite, aucune URL n'est téléchargée ;
 *  3. l'adresse IP résolue doit être publique : ni boucle locale, ni réseau
 *     privé, ni lien-local (169.254.169.254, métadonnées cloud), ni IPv6
 *     interne. La vérification porte sur **toutes** les adresses renvoyées.
 *
 * S'y ajoutent une limite de taille (4 Mo), un délai (8 s) et une liste
 * blanche de types de contenu. Aucune redirection n'est suivie par la
 * librairie HTTP : elles sont traitées à la main, donc recontrôlées.
 */
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export class ErreurCollecte extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'ErreurCollecte';
  }
}

const TAILLE_MAX = 4 * 1024 * 1024;
const DELAI_MS = 8000;
const REDIRECTIONS_MAX = 3;

const TYPES_ACCEPTES = new Set([
  'text/html',
  'application/xhtml+xml',
  'text/plain',
  'text/markdown',
  'application/pdf',
]);

/* ───────────────────────── Contrôles d'adresse ───────────────────────── */

function ipv4Privee(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number);
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // lien-local + métadonnées cloud
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true; // multicast + réservé
  return false;
}

function ipv6Privee(ip: string): boolean {
  const propre = ip.toLowerCase().split('%')[0];
  if (propre === '::1' || propre === '::') return true;
  if (propre.startsWith('fc') || propre.startsWith('fd')) return true; // ULA
  if (/^fe[89ab]/.test(propre)) return true; // lien-local
  // IPv4 encapsulée : ::ffff:127.0.0.1
  const m = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(propre);
  if (m) return ipv4Privee(m[1]);
  if (propre.startsWith('64:ff9b::')) return true;
  return false;
}

export function adressePublique(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return !ipv4Privee(ip);
  if (version === 6) return !ipv6Privee(ip);
  return false;
}

/* ───────────────────────── Contrôle d'URL ───────────────────────── */

export type HoteAutorise = { hote: string };

export type OptionsSecurite = {
  /** Hôtes autorisés (issus du catalogue de sources actives). */
  hotes: string[];
  /** Résolution DNS injectable pour les tests. */
  resoudre?: (hote: string) => Promise<string[]>;
  fetchImpl?: typeof fetch;
};

const resoudreReel = async (hote: string): Promise<string[]> => {
  const adresses = await lookup(hote, { all: true, verbatim: true });
  return adresses.map((a) => a.address);
};

/** L'hôte est-il couvert par le catalogue (lui-même ou un sous-domaine) ? */
export function hoteAutorise(hote: string, hotes: string[]): boolean {
  const cible = hote.toLowerCase().replace(/\.$/, '');
  return hotes.some((h) => {
    const autorise = h.toLowerCase().replace(/\.$/, '');
    return cible === autorise || cible.endsWith(`.${autorise}`);
  });
}

export async function verifierUrl(
  url: string,
  opts: OptionsSecurite,
): Promise<{ url: URL; adresses: string[] }> {
  let cible: URL;
  try {
    cible = new URL(url);
  } catch {
    throw new ErreurCollecte('URL invalide.', 'url-invalide');
  }
  if (cible.protocol !== 'https:' && cible.protocol !== 'http:') {
    throw new ErreurCollecte('Seuls les schémas http et https sont acceptés.', 'schema-refuse');
  }
  if (cible.username || cible.password) {
    throw new ErreurCollecte('Une URL ne doit pas contenir d’identifiants.', 'url-identifiants');
  }
  const port = cible.port ? Number(cible.port) : cible.protocol === 'https:' ? 443 : 80;
  if (port !== 80 && port !== 443) {
    throw new ErreurCollecte('Port non autorisé (80 ou 443 uniquement).', 'port-refuse');
  }
  const hote = cible.hostname.toLowerCase();
  if (!hote || hote === 'localhost' || hote.endsWith('.localhost') || hote.endsWith('.local') || hote.endsWith('.internal')) {
    throw new ErreurCollecte('Hôte interne refusé.', 'hote-interne');
  }
  if (!hoteAutorise(hote, opts.hotes)) {
    throw new ErreurCollecte(
      'Cette source n’est pas (encore) autorisée dans le catalogue : ajoutez-la et validez-la avant toute collecte.',
      'source-non-autorisee',
    );
  }

  let adresses: string[];
  if (isIP(hote)) {
    adresses = [hote];
  } else {
    const resoudre = opts.resoudre ?? resoudreReel;
    try {
      adresses = await resoudre(hote);
    } catch {
      throw new ErreurCollecte('Nom d’hôte introuvable (DNS).', 'dns-echec');
    }
  }
  if (adresses.length === 0) throw new ErreurCollecte('Aucune adresse IP pour cet hôte.', 'dns-vide');
  for (const adresse of adresses) {
    if (!adressePublique(adresse)) {
      throw new ErreurCollecte(
        `Adresse interne refusée (${adresse}) : une URL publique ne peut pas pointer vers le réseau local.`,
        'adresse-interne',
      );
    }
  }
  return { url: cible, adresses };
}

/* ───────────────────────── Téléchargement ───────────────────────── */

export type Telechargement = {
  urlFinale: string;
  typeContenu: string;
  donnees: Buffer;
  redirections: number;
};

async function lireAvecPlafond(reponse: Response): Promise<Buffer> {
  const annonce = Number(reponse.headers.get('content-length') ?? '0');
  if (Number.isFinite(annonce) && annonce > TAILLE_MAX) {
    throw new ErreurCollecte('Document trop volumineux (4 Mo maximum).', 'taille');
  }
  if (!reponse.body) return Buffer.alloc(0);
  const lecteur = reponse.body.getReader();
  const morceaux: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lecteur.read();
    if (done) break;
    total += value.byteLength;
    if (total > TAILLE_MAX) {
      await lecteur.cancel();
      throw new ErreurCollecte('Document trop volumineux (4 Mo maximum).', 'taille');
    }
    morceaux.push(value);
  }
  return Buffer.concat(morceaux);
}

/**
 * Télécharge une URL autorisée. Les redirections sont suivies une à une et
 * **revalidées** (schéma, hôte, DNS) : une redirection vers 127.0.0.1 est
 * refusée comme une URL initiale.
 */
export async function telecharger(url: string, opts: OptionsSecurite): Promise<Telechargement> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  let courante = url;
  for (let saut = 0; saut <= REDIRECTIONS_MAX; saut++) {
    await verifierUrl(courante, opts);
    const controle = new AbortController();
    const minuteur = setTimeout(() => controle.abort(), DELAI_MS);
    let reponse: Response;
    try {
      reponse = await fetchImpl(courante, {
        redirect: 'manual',
        signal: controle.signal,
        headers: {
          // Identification honnête : pas de déguisement en navigateur.
          'User-Agent': 'AuraBot/1.0 (+collecte documentaire autorisée)',
          Accept: 'text/html,application/xhtml+xml,text/plain,application/pdf',
        },
      });
    } catch {
      clearTimeout(minuteur);
      throw new ErreurCollecte('Le site n’a pas répondu dans le délai imparti.', 'delai');
    }
    clearTimeout(minuteur);

    if (reponse.status >= 300 && reponse.status < 400) {
      const destination = reponse.headers.get('location');
      if (!destination) throw new ErreurCollecte('Redirection sans destination.', 'redirection');
      if (saut === REDIRECTIONS_MAX) {
        throw new ErreurCollecte('Trop de redirections.', 'redirection-boucle');
      }
      courante = new URL(destination, courante).toString();
      continue;
    }
    if (!reponse.ok) {
      throw new ErreurCollecte(`Le site a répondu ${reponse.status}.`, 'http');
    }

    const type = (reponse.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (!TYPES_ACCEPTES.has(type)) {
      throw new ErreurCollecte(`Type de contenu non accepté : ${type || 'inconnu'}.`, 'type-refuse');
    }
    const donnees = await lireAvecPlafond(reponse);
    return { urlFinale: courante, typeContenu: type, donnees, redirections: saut };
  }
  throw new ErreurCollecte('Trop de redirections.', 'redirection-boucle');
}
