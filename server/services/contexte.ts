/**
 * Construction du contexte envoyé au modèle — sélection explicite,
 * jamais « toute la base de données ».
 *
 * Sources, dans cet ordre :
 *  1. Instruction système (identité, règles d'honnêteté, langue, ton).
 *  2. Profil contextuel de l'utilisateur (AURA Local) — uniquement les
 *     champs renseignés, présentés comme préférences (jamais comme faits
 *     vérifiés).
 *  3. Instructions du projet rattaché à la conversation (si projet).
 *  4. Mémoires actives (max 10, du plus récent au plus ancien) — les ids
 *     utilisés sont retournés pour être rendus visibles à l'utilisateur.
 *
 * Ce qui n'est JAMAIS envoyé : les autres conversations, les données des
 * autres projets, les mémoires inactives, les mots de passe, les clés.
 */
import type { Compte, Memoire, Message, Projet } from '../db/types';

export type ContexteModele = {
  system: string;
  memoiresUtilisees: string[];
};

const MAX_MEMOIRES = 10;

function instructionBase(langue: 'fr' | 'en'): string {
  return langue === 'en'
    ? "You are Aura, the assistant of the Aura workspace. Answer in the user's language, clearly and honestly. Never invent facts, sources, prices, or features. If you don't know, say so. The context below is user-provided preference data, not verified facts: use it to adapt tone, currency, units and examples, but never present unverified local information as certain. Keep answers useful and concise."
    : "Tu es Aura, l'assistant de l'espace de travail Aura. Réponds dans la langue de l'utilisateur, clairement et honnêtement. N'invente jamais de faits, de sources, de prix ou de fonctionnalités. Si tu ne sais pas, dis-le. Le contexte ci-dessous est fourni par l'utilisateur : il sert à adapter le ton, la devise, les unités et les exemples, mais ne constitue pas des faits vérifiés — ne présente jamais une information locale non vérifiée comme certaine. Des réponses utiles et concises.";
}

export function construireContexte(opts: {
  compte: Compte;
  langue: 'fr' | 'en';
  projet?: Projet | null;
  memoires?: Memoire[];
  preferencesForcees?: boolean;
}): ContexteModele {
  const { compte, langue, projet } = opts;
  const sections: string[] = [instructionBase(langue)];
  const memoiresUtilisees: string[] = [];

  // Profil contextuel (AURA Local) — uniquement ce qui est renseigné.
  const p = compte.profil;
  const lignesProfil: string[] = [];
  if (p.pays) lignesProfil.push(`pays : ${p.pays}`);
  if (p.region) lignesProfil.push(`région/ville : ${p.region}`);
  if (p.devise) lignesProfil.push(`devise préférée : ${p.devise}`);
  if (p.fuseau) lignesProfil.push(`fuseau horaire : ${p.fuseau}`);
  if (p.unites) lignesProfil.push(`unités : ${p.unites === 'imperiales' ? 'impériales' : 'métriques'}`);
  if (p.domaine) lignesProfil.push(`domaine d'activité : ${p.domaine}`);
  if (p.languesSecondaires.length) lignesProfil.push(`langues secondaires : ${p.languesSecondaires.join(', ')}`);
  if (lignesProfil.length) {
    sections.push(
      (langue === 'en' ? 'User context (preferences, not verified facts):\n' : 'Contexte utilisateur (préférences, faits non vérifiés) :\n') +
        lignesProfil.map((l) => `- ${l}`).join('\n'),
    );
  }

  // Ton de réponse.
  const pref = compte.preferences;
  const ton =
    pref.tonReponse === 'detaille'
      ? langue === 'en' ? 'detailed' : 'détaillé'
      : pref.tonReponse === 'pedagogique'
        ? langue === 'en' ? 'pedagogical' : 'pédagogique'
        : langue === 'en' ? 'concise' : 'concis';
  sections.push(langue === 'en' ? `Preferred answer style: ${ton}.` : `Ton de réponse préféré : ${ton}.`);

  // Instructions du projet.
  if (projet) {
    const bloc = [
      langue === 'en' ? `Active project: "${projet.nom}".` : `Projet en cours : « ${projet.nom} ».`,
      projet.objectif ? (langue === 'en' ? `Objective: ${projet.objectif}` : `Objectif : ${projet.objectif}`) : '',
      projet.instructions ? (langue === 'en' ? `Project instructions:\n${projet.instructions}` : `Instructions du projet :\n${projet.instructions}`) : '',
    ]
      .filter(Boolean)
      .join('\n');
    sections.push(bloc);
    // Instruction de projet aussi visible en mémoire (traçabilité).
  }

  // Mémoires actives.
  const memoires = (opts.memoires ?? []).filter((m) => m.actif);
  if (compte.preferences.utiliserMemoire && memoires.length) {
    const retenues = memoires.slice(0, MAX_MEMOIRES);
    const etiquette = langue === 'en' ? 'User-approved memories:' : 'Mémoires validées par l’utilisateur :';
    sections.push(
      etiquette + '\n' + retenues.map((m) => `- [${m.id}] (${m.type}) ${m.contenu}`).join('\n'),
    );
    for (const m of retenues) memoiresUtilisees.push(m.id);
    if (projet) {
      const memoiresProjet = memoires.filter((m) => m.projectId === projet.id && !retenues.includes(m));
      for (const m of memoiresProjet.slice(0, 5)) {
        memoiresUtilisees.push(m.id);
      }
    }
  }

  return { system: sections.join('\n\n'), memoiresUtilisees };
}

/** Historique de conversation → messages pour le modèle (limités). */
export function versMessagesModele(
  messages: Message[],
  limite = 30,
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages
    .filter((m) => m.statut !== 'erreur' && (m.role === 'user' || m.role === 'assistant'))
    .slice(-limite)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.contenu }));
}
