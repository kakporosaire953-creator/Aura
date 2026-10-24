/**
 * Historique local des conversations.
 *
 * Données RÉELLES de l'utilisateur, stockées uniquement sur son
 * appareil (localStorage) — jamais envoyées nulle part. La synchro
 * serveur arrivera avec le moteur de comptes (KV) ; en attendant,
 * l'interface l'annonce honnêtement.
 */

export type MessageChat = { role: 'user' | 'assistant'; content: string };

export type FilLocal = {
  id: string;
  titre: string;
  date: string; // ISO
  messages: MessageChat[];
};

const CLE = 'aura_historique';
const MAX_FILS = 40;
const MAX_MESSAGES = 60;

function lire(): FilLocal[] {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return [];
    const liste = JSON.parse(brut) as FilLocal[];
    return Array.isArray(liste) ? liste : [];
  } catch {
    return [];
  }
}

function ecrire(fils: FilLocal[]): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(fils.slice(0, MAX_FILS)));
  } catch {
    /* stockage plein ou indisponible — on ne casse pas l'UI */
  }
}

export function nouvelIdFil(): string {
  return `fil-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function listerFils(): FilLocal[] {
  return lire().sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function filParId(id: string): FilLocal | null {
  return lire().find((f) => f.id === id) ?? null;
}

export function sauverFil(id: string, messages: MessageChat[]): void {
  if (messages.length === 0) return;
  const premierUser = messages.find((m) => m.role === 'user');
  const titre = (premierUser?.content ?? '').trim().slice(0, 80) || 'Conversation';
  const fils = lire().filter((f) => f.id !== id);
  fils.unshift({
    id,
    titre,
    date: new Date().toISOString(),
    messages: messages.slice(-MAX_MESSAGES),
  });
  ecrire(fils);
}

export function supprimerFil(id: string): void {
  ecrire(lire().filter((f) => f.id !== id));
}

/** « il y a 2 heures » / « 2 hours ago » — datation relative courte. */
export function ilYATexte(iso: string, lang: 'fr' | 'en'): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.max(0, Math.round(ms / 60000));
  const h = Math.round(min / 60);
  const j = Math.round(h / 24);
  if (lang === 'en') {
    if (min < 1) return 'just now';
    if (min < 60) return `${min} min ago`;
    if (h < 24) return `${h}h ago`;
    return `${j}d ago`;
  }
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${j} j`;
}
