/**
 * Validation des messages du chat (route historique `/api/chat`).
 * L'appel au moteur lui-même passe par le service IA central
 * (`server/ai/service.ts`) — plus aucun appel fournisseur dans ce module.
 */
export type MessageChat = { role: 'user' | 'assistant'; content: string };

export const LIMITE_MESSAGES = 40;
export const LIMITE_CARACTERES = 4000;

export function validerMessages(brut: unknown): { ok: true; messages: MessageChat[] } | { ok: false } {
  if (!Array.isArray(brut) || brut.length === 0 || brut.length > LIMITE_MESSAGES) {
    return { ok: false };
  }
  const messages: MessageChat[] = [];
  for (const m of brut) {
    if (typeof m !== 'object' || m === null) return { ok: false };
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if (role !== 'user' && role !== 'assistant') return { ok: false };
    if (typeof content !== 'string') return { ok: false };
    const texte = content.trim();
    if (!texte || texte.length > LIMITE_CARACTERES) return { ok: false };
    messages.push({ role, content: texte });
  }
  if (messages[messages.length - 1].role !== 'user') return { ok: false };
  return { ok: true, messages };
}
