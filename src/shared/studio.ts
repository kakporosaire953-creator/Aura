/**
 * Helpers purs partagés par le serveur et le client pour les projets Aura Studio :
 * extraction de fichiers, composition d'aperçu isolé, validation de compilation.
 */
import type { VirtualStudioFile } from './types.ts';

export function detectFileLanguage(path: string, fenceLang: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const byExt: Record<string, string> = {
    html: 'html',
    htm: 'html',
    css: 'css',
    js: 'javascript',
    mjs: 'javascript',
    ts: 'typescript',
    json: 'json',
    svg: 'svg',
    md: 'markdown',
    txt: 'text',
  };
  return byExt[ext] || fenceLang || 'text';
}

/**
 * Extrait une arborescence de fichiers à partir de blocs de code balisés :
 * ```html index.html  —  ```css styles.css  —  etc.
 */
export function extractStudioFiles(markdown: string): VirtualStudioFile[] {
  const fenceRegex = /```([A-Za-z0-9_+-]*)(?:[ \t]+([A-Za-z0-9_\-./ ]+))?[ \t]*\n([\s\S]*?)```/g;
  const matches = [...markdown.matchAll(fenceRegex)];
  const files: VirtualStudioFile[] = [];
  const used = new Set<string>();

  const extMap: Record<string, string> = {
    html: 'index.html',
    htm: 'index.html',
    css: 'styles.css',
    javascript: 'app.js',
    js: 'app.js',
    typescript: 'app.ts',
    ts: 'app.ts',
    json: 'data.json',
    svg: 'assets/illustration.svg',
    markdown: 'README.md',
    md: 'README.md',
    txt: 'notes.txt',
  };

  matches.forEach((m, idx) => {
    const fenceLang = (m[1] || '').toLowerCase();
    const hintedName = (m[2] || '').trim();
    const content = (m[3] || '').trim();
    if (!content) return;

    let filePath = hintedName.replace(/^\/+/, '');
    if (!filePath) {
      filePath =
        extMap[fenceLang] ||
        (idx === 0 ? 'index.html' : `file-${idx + 1}.${fenceLang || 'txt'}`);
    }
    const key = filePath.toLowerCase();
    if (used.has(key)) {
      const dot = filePath.lastIndexOf('.');
      filePath =
        dot > 0
          ? `${filePath.slice(0, dot)}-${idx + 1}${filePath.slice(dot)}`
          : `${filePath}-${idx + 1}`;
    }
    used.add(filePath.toLowerCase());
    files.push({
      path: filePath,
      language: detectFileLanguage(filePath, fenceLang),
      content,
    });
  });

  return files;
}

/** Garantit un `index.html` autonome dans l'arborescence. */
export function ensureIndexHtml(files: VirtualStudioFile[]): VirtualStudioFile[] {
  const hasIndex = files.some((f) => f.path.toLowerCase() === 'index.html');
  if (hasIndex) return files;

  const htmlLike = files.find(
    (f) =>
      f.language === 'html' ||
      f.path.toLowerCase().endsWith('.html') ||
      f.content.includes('<html') ||
      f.content.includes('<div')
  );
  if (
    htmlLike &&
    (htmlLike.content.includes('<html') || htmlLike.content.includes('<!DOCTYPE'))
  ) {
    return [
      { path: 'index.html', language: 'html', content: htmlLike.content },
      ...files.filter((f) => f !== htmlLike),
    ];
  }

  const css = files.find((f) => f.language === 'css');
  const js = files.find(
    (f) => f.language === 'javascript' || f.language === 'typescript'
  );
  const body = htmlLike?.content || files[0]?.content || '<p>Projet vide.</p>';
  const wrapped = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Création Aura Studio</title>
  ${css ? '<link rel="stylesheet" href="styles.css" />' : ''}
</head>
<body>
${body}
  ${js ? '<script src="app.js"></script>' : ''}
</body>
</html>`;
  return [{ path: 'index.html', language: 'html', content: wrapped }, ...files];
}

/**
 * Construit le document HTML autonome rendu dans l'aperçu isolé (iframe
 * sandboxée sans same-origin) : CSS/JS locaux référencés par index.html inlinés.
 */
export function composePreviewHtml(files: VirtualStudioFile[]): string {
  const byPath = new Map(files.map((f) => [f.path.toLowerCase(), f]));
  let html =
    byPath.get('index.html')?.content ||
    files.find((f) => f.path.toLowerCase().endsWith('.html'))?.content ||
    '';

  if (!html.trim()) {
    return `<!DOCTYPE html><html><body style="font-family:system-ui;padding:40px;color:#697477">
      <p>Ce projet ne contient encore aucun fichier HTML à afficher.</p></body></html>`;
  }

  html = html.replace(
    /<link\b[^>]*href=["']([^"']+\.css)["'][^>]*>/gi,
    (full, href: string) => {
      const key = href.replace(/^\.\//, '').replace(/^\//, '').toLowerCase();
      const file = byPath.get(key);
      return file ? `<style>\n${file.content}\n</style>` : full;
    }
  );

  html = html.replace(
    /<script\b[^>]*src=["']([^"']+\.js)["'][^>]*>\s*<\/script>/gi,
    (full, src: string) => {
      const key = src.replace(/^\.\//, '').replace(/^\//, '').toLowerCase();
      const file = byPath.get(key);
      return file ? `<script>\n${file.content}\n</script>` : full;
    }
  );

  return html;
}

/** Validation honnête d'un projet statique avant compilation/aperçu. */
export function validateStudioProject(files: VirtualStudioFile[]): {
  ok: boolean;
  error?: string;
} {
  if (!files || files.length === 0) {
    return { ok: false, error: 'Le projet ne contient aucun fichier.' };
  }
  const index = files.find((f) => f.path.toLowerCase() === 'index.html');
  if (!index) {
    return {
      ok: false,
      error:
        'Fichier index.html introuvable — la compilation a été conservée en l’état.',
    };
  }
  const openTags = (index.content.match(/<html/gi) || []).length;
  const closeTags = (index.content.match(/<\/html>/gi) || []).length;
  if (openTags > 0 && closeTags === 0) {
    return {
      ok: false,
      error: 'index.html : balise </html> manquante ou structure HTML incomplète.',
    };
  }
  for (const f of files) {
    if (f.path.toLowerCase().endsWith('.css')) {
      const open = (f.content.match(/\{/g) || []).length;
      const close = (f.content.match(/\}/g) || []).length;
      if (open !== close) {
        return {
          ok: false,
          error: `${f.path} : accolades CSS déséquilibrées (${open} ouvrantes / ${close} fermantes).`,
        };
      }
    }
  }
  return { ok: true };
}
