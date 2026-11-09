/**
 * Lecture du contenu d'une création (Markdown produit par le modèle) vers une
 * suite de blocs typés, partagée par les exports DOCX et PDF.
 *
 * Le but n'est pas de réimplémenter un moteur Markdown : seulement de rendre
 * lisible à l'écrit ce qu'une création contient réellement (titres, listes,
 * citations, code). Tout ce qui n'est pas reconnu reste du texte — rien n'est
 * perdu, rien n'est inventé.
 */

export type Bloc =
  | { type: 'titre'; niveau: 1 | 2 | 3; texte: string }
  | { type: 'paragraphe'; texte: string }
  | { type: 'puce'; texte: string }
  | { type: 'numerote'; texte: string }
  | { type: 'citation'; texte: string }
  | { type: 'code'; texte: string }
  | { type: 'espace' };

export type DocumentLisible = {
  titre: string;
  sousTitre: string;
  blocs: Bloc[];
};

/** Retire le balisage en ligne en conservant le texte et les liens visibles. */
export function nettoyerEnLigne(brut: string): string {
  let s = brut;
  // Images puis liens : on garde le libellé, et l'URL quand elle est utile.
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_m, alt: string, url: string) =>
    alt ? `${alt} (${url})` : url,
  );
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_m, texte: string, url: string) =>
    texte === url ? url : `${texte} (${url})`,
  );
  s = s.replace(/`([^`]+)`/g, '$1');
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  s = s.replace(/__([^_]+)__/g, '$1');
  s = s.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1$2');
  s = s.replace(/(^|[\s(])_([^_\s][^_]*)_/g, '$1$2');
  s = s.replace(/~~([^~]+)~~/g, '$1');
  // Échappements Markdown les plus courants.
  s = s.replace(/\\([\\`*_{}[\]()#+\-.!>])/g, '$1');
  return s.replace(/\s+$/, '');
}

const TITRE = /^(#{1,6})\s+(.*)$/;
const PUCE = /^\s{0,3}[-*+]\s+(.*)$/;
const NUMEROTE = /^\s{0,3}(\d{1,3})[.)]\s+(.*)$/;
const CITATION = /^\s{0,3}>\s?(.*)$/;
const REGLE = /^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/;

/**
 * Découpe un Markdown en blocs. Les lignes consécutives forment un seul
 * paragraphe (comme à l'affichage), pour éviter des paragraphes d'une ligne.
 */
export function analyserMarkdown(markdown: string): Bloc[] {
  const lignes = markdown.replace(/\r\n?/g, '\n').split('\n');
  const blocs: Bloc[] = [];
  let paragraphe: string[] = [];

  const viderParagraphe = () => {
    if (paragraphe.length === 0) return;
    const texte = paragraphe.map((l) => nettoyerEnLigne(l)).join(' ').replace(/\s+/g, ' ').trim();
    if (texte) blocs.push({ type: 'paragraphe', texte });
    paragraphe = [];
  };

  for (let i = 0; i < lignes.length; i += 1) {
    const ligne = lignes[i];

    // Bloc de code clôturé ou non (une création tronquée ne doit pas perdre sa fin).
    if (/^\s{0,3}```/.test(ligne)) {
      viderParagraphe();
      const dedans: string[] = [];
      i += 1;
      while (i < lignes.length && !/^\s{0,3}```/.test(lignes[i])) {
        dedans.push(lignes[i]);
        i += 1;
      }
      blocs.push({ type: 'code', texte: dedans.join('\n') });
      continue;
    }

    if (!ligne.trim()) {
      viderParagraphe();
      continue;
    }

    const titre = TITRE.exec(ligne);
    if (titre) {
      viderParagraphe();
      const niveau = Math.min(3, titre[1].length) as 1 | 2 | 3;
      const texte = nettoyerEnLigne(titre[2]).trim();
      if (texte) blocs.push({ type: 'titre', niveau, texte });
      continue;
    }

    if (REGLE.test(ligne)) {
      viderParagraphe();
      blocs.push({ type: 'espace' });
      continue;
    }

    const puce = PUCE.exec(ligne);
    if (puce) {
      viderParagraphe();
      const texte = nettoyerEnLigne(puce[1]).trim();
      if (texte) blocs.push({ type: 'puce', texte });
      continue;
    }

    const numerote = NUMEROTE.exec(ligne);
    if (numerote) {
      viderParagraphe();
      const texte = nettoyerEnLigne(numerote[2]).trim();
      if (texte) blocs.push({ type: 'numerote', texte: `${numerote[1]}. ${texte}` });
      continue;
    }

    const citation = CITATION.exec(ligne);
    if (citation) {
      viderParagraphe();
      const texte = nettoyerEnLigne(citation[1]).trim();
      if (texte) blocs.push({ type: 'citation', texte });
      continue;
    }

    paragraphe.push(ligne.trim());
  }

  viderParagraphe();
  return blocs;
}

/** Assemble le document lisible à partir des métadonnées d'une création. */
export function composerDocument(meta: {
  titre: string;
  type: string;
  version: number;
  cree: string;
  contenu: string;
  langue?: 'fr' | 'en';
}): DocumentLisible {
  const date = new Date(meta.cree);
  const quand = Number.isNaN(date.getTime())
    ? meta.cree
    : date.toLocaleDateString(meta.langue === 'en' ? 'en-GB' : 'fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
  const etiquette = meta.type.replace(/_/g, ' ');
  return {
    titre: meta.titre,
    sousTitre: `Aura — ${etiquette} · version ${meta.version} · ${quand}`,
    blocs: analyserMarkdown(meta.contenu),
  };
}

/** Nom de fichier sûr (ASCII), dérivé du titre. */
export function nomFichierSur(titre: string, extension: string): string {
  const base =
    titre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'creation';
  return `${base}.${extension}`;
}
