/**
 * Aura Studio — moteur de génération de projets.
 *
 * Contrairement au chat classique, Studio produit une structure de fichiers
 * réelle (HTML/CSS/JS...) persistée, versionnée et éditable en Developer Mode.
 * Ce module reste indépendant du fournisseur IA : il construit les prompts et
 * interprète la réponse de n'importe quel adaptateur `AIProviderAdapter`.
 */
import type { StudioProjectType, VirtualStudioFile } from '../../shared/types.ts';
import {
  ensureIndexHtml,
  extractStudioFiles,
  composePreviewHtml,
  validateStudioProject,
} from '../../shared/studio.ts';

export {
  ensureIndexHtml,
  extractStudioFiles,
  composePreviewHtml,
  validateStudioProject,
};

const TYPE_FR: Record<StudioProjectType, string> = {
  'site-web': 'site web complet',
  'application-web': 'application web interactive',
  dashboard: 'dashboard / tableau de bord',
  portfolio: 'portfolio',
  'landing-page': 'landing page',
  'design-ui': 'interface de design UI',
  document: 'document structuré (HTML imprimable)',
};

export function buildStudioCreationPrompt(params: {
  idea: string;
  name?: string;
  type?: StudioProjectType;
  sections?: string;
  styleNotes?: string;
  language: 'fr' | 'en';
}): string {
  const typeLabel = params.type ? TYPE_FR[params.type] : 'site web';
  return [
    `Tu es le moteur de génération d'Aura Studio. Génère un ${typeLabel} professionnel, autonome et immédiatement prévisualisable.`,
    '',
    `## Idée de l'utilisateur`,
    params.idea,
    params.sections ? `\n## Sections / fonctionnalités demandées\n${params.sections}` : '',
    params.styleNotes ? `\n## Direction artistique\n${params.styleNotes}` : '',
    params.name ? `\n## Nom du projet\n${params.name}` : '',
    '',
    `## Format de sortie STRICT (obligatoire)`,
    `Réponds uniquement avec des blocs de code balisés par un nom de fichier, sans texte hors blocs :`,
    '```html index.html',
    '<!-- document HTML complet -->',
    '```',
    '```css styles.css',
    '/* feuille de style */',
    '```',
    '```javascript app.js',
    '// interactions',
    '```',
    '',
    `## Contraintes techniques`,
    `- index.html doit être un document HTML5 complet (<!DOCTYPE html>), en ${params.language === 'fr' ? 'français' : 'English'}, responsive.`,
    `- CSS dans styles.css, JS dans app.js (vanilla, aucun bundler).`,
    `- Les liens <link href="styles.css"> et <script src="app.js"> doivent correspondre aux noms de fichiers.`,
    `- Design premium : hiérarchie typographique claire, espaces généreux, micro-interactions sobres, pas de dépendance CDN obligatoire.`,
    `- Accessibilité : labels, contrastes, navigation clavier.`,
    `- Tout le contenu doit être réel et cohérent (pas de lorem ipsum, pas de boutons morts : chaque action a un comportement JS visible).`,
    `- Aucune mention d'API, clé ou backend non fourni : le projet doit fonctionner hors-ligne tel quel.`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildStudioIterationPrompt(params: {
  instruction: string;
  files: VirtualStudioFile[];
  language: 'fr' | 'en';
}): string {
  const fileDump = params.files
    .map((f) => {
      const ext = f.path.split('.').pop()?.toLowerCase() || 'txt';
      const lang =
        ext === 'html'
          ? 'html'
          : ext === 'css'
            ? 'css'
            : ext === 'js'
              ? 'javascript'
              : ext === 'ts'
                ? 'typescript'
                : ext === 'json'
                  ? 'json'
                  : 'txt';
      return `\`\`\`${lang} ${f.path}\n${f.content}\n\`\`\``;
    })
    .join('\n\n');

  return [
    `Tu es le moteur d'édition itérative d'Aura Studio. Applique la modification demandée AU PROJET EXISTANT sans tout réécrire inutilement.`,
    '',
    `## Instruction de l'utilisateur`,
    params.instruction,
    '',
    `## Projet actuel (fichiers complets)`,
    fileDump,
    '',
    `## Format de sortie STRICT (obligatoire)`,
    `Réponds uniquement avec les blocs de code des fichiers modifiés ou créés, en conservant EXACTEMENT les mêmes noms de chemins :`,
    '```html index.html',
    '... fichier complet mis à jour ...',
    '```',
    '',
    `## Règles`,
    `- Renvoie TOUJOURS index.html complet si le HTML change (jamais de diff partiel).`,
    `- Ne renvoie que les fichiers réellement modifiés ; les autres seront conservés automatiquement.`,
    `- Préserve le code existant qui fonctionne et le style déjà en place, sauf instruction contraire.`,
    `- Réponds en ${params.language === 'fr' ? 'français pour tout texte de l\'interface généré' : 'English for generated UI copy'}.`,
  ].join('\n');
}
