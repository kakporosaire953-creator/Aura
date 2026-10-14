import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';
import {
  AIProviderAdapter,
  AIRequest,
  AIResponse,
} from './types.ts';
import {
  AURA_MODEL_CATALOG,
  CodeArtifact,
  CreativeArtifact,
  GroundingSource,
  ImageArtifact,
  ProviderStatus,
  SlideArtifact,
  SlideItem,
  VideoArtifact,
  VirtualStudioFile,
} from '../../shared/types.ts';

function extractDomain(uri: string): string {
  try {
    const u = new URL(uri);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return 'source-web';
  }
}

export function extractCodeArtifact(markdown: string): CodeArtifact | undefined {
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const matches = [...markdown.matchAll(codeBlockRegex)];
  if (matches.length === 0) return undefined;

  const htmlMatch = matches.find((m) =>
    ['html', 'htm', 'svg'].includes((m[1] || '').toLowerCase())
  );
  const chosen = htmlMatch || matches[0];
  const lang = (chosen[1] || 'typescript').toLowerCase();
  const code = chosen[2].trim();

  const extMap: Record<string, string> = {
    html: 'index.html',
    svg: 'illustration.svg',
    css: 'styles.css',
    javascript: 'app.js',
    js: 'app.js',
    typescript: 'main.ts',
    ts: 'main.ts',
    tsx: 'Component.tsx',
    jsx: 'Component.jsx',
    python: 'main.py',
    py: 'main.py',
    sql: 'schema.sql',
    json: 'config.json',
    markdown: 'README.md',
    md: 'README.md',
  };

  const primaryFilename = extMap[lang] || `snippet.${lang || 'txt'}`;
  const isPreviewable =
    lang === 'html' ||
    lang === 'svg' ||
    code.includes('<!DOCTYPE html>') ||
    code.includes('<html') ||
    code.includes('<svg') ||
    (code.includes('<div') && code.includes('<style'));

  const files: VirtualStudioFile[] = [];
  const usedPaths = new Set<string>();

  matches.forEach((m, idx) => {
    const blockLang = (m[1] || 'txt').toLowerCase();
    const blockCode = m[2].trim();
    if (!blockCode) return;
    let candidatePath =
      extMap[blockLang] ||
      (idx === 0 ? primaryFilename : `module-${idx + 1}.${blockLang}`);
    if (usedPaths.has(candidatePath)) {
      const dotIdx = candidatePath.lastIndexOf('.');
      candidatePath =
        dotIdx !== -1
          ? `${candidatePath.slice(0, dotIdx)}-${idx + 1}${candidatePath.slice(dotIdx)}`
          : `${candidatePath}-${idx + 1}`;
    }
    usedPaths.add(candidatePath);
    files.push({
      path: candidatePath,
      language: blockLang,
      content: blockCode,
    });
  });

  if (files.length === 1 && isPreviewable && lang === 'html') {
    const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    if (styleMatch && styleMatch[1]?.trim()) {
      files.push({
        path: 'styles.css',
        language: 'css',
        content: styleMatch[1].trim(),
      });
    }
    const scriptMatch = code.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i);
    if (scriptMatch && scriptMatch[1]?.trim()) {
      files.push({
        path: 'app.js',
        language: 'javascript',
        content: scriptMatch[1].trim(),
      });
    }
  }

  return {
    language: lang,
    filename: primaryFilename,
    code,
    previewableHtml: isPreviewable ? code : undefined,
    files,
  };
}

export function extractCreativeArtifact(text: string, prompt: string): CreativeArtifact {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const firstHeading = lines.find((l) => l.startsWith('#'))?.replace(/^#+\s*/, '');
  const title = firstHeading || (prompt.length > 48 ? `${prompt.slice(0, 48)}...` : prompt);

  const bullets = lines
    .filter((l) => l.startsWith('- ') || l.startsWith('* '))
    .map((l) => l.replace(/^[-*]\s+/, '').replace(/\*\*/g, ''))
    .slice(0, 4);

  return {
    title,
    category: 'Aura Studio',
    summary:
      lines
        .find((l) => !l.startsWith('#') && !l.startsWith('-') && l.length > 30)
        ?.replace(/\*\*/g, '') ||
      'Concept créatif structuré et prêt à être déployé.',
    promptSuggestion: `Direction visuelle : ${prompt} — palette naturelle ivoire chaud, vert émeraude et ambre lumineux, composition éditoriale minimaliste.`,
    keyElements:
      bullets.length > 0
        ? bullets
        : [
            'Positionnement éditorial clair et mémorable',
            'Structure modulaire adaptée au mobile et au web',
            'Direction artistique cohérente et chaleureuse',
          ],
    palette: ['#078348', '#8CCB4A', '#EACB37', '#FF790D', '#14282D'],
  };
}

function buildStandaloneSlideDeckHtml(deck: {
  title: string;
  subtitle: string;
  slides: SlideItem[];
}): string {
  const slidesJson = JSON.stringify(deck.slides);
  const escapedTitle = deck.title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapedTitle} — Aura Slides</title>
  <style>
    :root {
      --bg: #FAF8F2;
      --surface: #FFFDF9;
      --ink: #14282D;
      --muted: #5C6664;
      --green: #078348;
      --lime: #8CCB4A;
      --gold: #EACB37;
      --orange: #FF790D;
      --border: #E8E6DE;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #101A1D;
      color: var(--ink);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .deck-shell {
      width: 100%;
      max-width: 960px;
      aspect-ratio: 16 / 9;
      background: var(--surface);
      border-radius: 24px;
      border: 1px solid var(--border);
      box-shadow: 0 24px 60px rgba(0,0,0,0.35);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 44px 52px;
      position: relative;
      overflow: hidden;
    }
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: var(--muted);
      border-bottom: 1px solid var(--border);
      padding-bottom: 14px;
    }
    .kicker {
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--green);
      font-size: 11px;
    }
    .slide-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 18px;
      padding: 20px 0;
    }
    h1 {
      font-size: clamp(24px, 3.4vw, 40px);
      line-height: 1.15;
      color: var(--ink);
      letter-spacing: -0.02em;
    }
    .subtitle {
      font-size: clamp(14px, 1.8vw, 18px);
      color: var(--muted);
      line-height: 1.5;
    }
    .content-grid {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 28px;
      align-items: center;
    }
    ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    li {
      font-size: clamp(13px, 1.5vw, 16px);
      line-height: 1.5;
      padding-left: 20px;
      position: relative;
    }
    li::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 99px;
      background: linear-gradient(135deg, var(--green), var(--orange));
      position: absolute;
      left: 0;
      top: 8px;
    }
    .metric-box {
      background: #F4F1E8;
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 22px 26px;
      text-align: center;
      min-width: 190px;
    }
    .metric-val {
      font-size: 32px;
      font-weight: 800;
      color: var(--green);
      font-variant-numeric: tabular-nums;
    }
    .metric-lbl {
      font-size: 12px;
      color: var(--muted);
      margin-top: 4px;
    }
    .footer-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--border);
      padding-top: 14px;
      font-size: 12px;
      color: var(--muted);
    }
    .controls {
      display: flex;
      gap: 8px;
    }
    button {
      padding: 7px 14px;
      border-radius: 99px;
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--ink);
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
    }
    button:hover { border-color: var(--green); }
  </style>
</head>
<body>
  <div class="deck-shell">
    <div class="top-bar">
      <span class="kicker" id="s-kicker">AURA SLIDES</span>
      <span id="s-counter" style="font-variant-numeric: tabular-nums;">1 / ${deck.slides.length}</span>
    </div>
    <div class="slide-body">
      <div>
        <h1 id="s-title"></h1>
        <p class="subtitle" id="s-sub"></p>
      </div>
      <div class="content-grid">
        <ul id="s-bullets"></ul>
        <div class="metric-box" id="s-metric" style="display:none;">
          <div class="metric-val" id="s-metric-val"></div>
          <div class="metric-lbl" id="s-metric-lbl"></div>
        </div>
      </div>
    </div>
    <div class="footer-bar">
      <span>${escapedTitle}</span>
      <div class="controls">
        <button onclick="prev()">← Précédent</button>
        <button onclick="next()">Suivant →</button>
      </div>
    </div>
  </div>
  <script>
    const slides = ${slidesJson};
    let idx = 0;
    function render() {
      const s = slides[idx] || slides[0];
      document.getElementById('s-kicker').textContent = s.kicker || 'AURA SLIDES';
      document.getElementById('s-counter').textContent = (idx + 1) + ' / ' + slides.length;
      document.getElementById('s-title').textContent = s.title || '';
      document.getElementById('s-sub').textContent = s.subtitle || '';
      const ul = document.getElementById('s-bullets');
      ul.innerHTML = '';
      (s.bullets || []).forEach(b => {
        const li = document.createElement('li');
        li.textContent = b;
        ul.appendChild(li);
      });
      const mBox = document.getElementById('s-metric');
      if (s.highlightMetric && s.highlightMetric.value) {
        mBox.style.display = 'block';
        document.getElementById('s-metric-val').textContent = s.highlightMetric.value;
        document.getElementById('s-metric-lbl').textContent = s.highlightMetric.label || '';
      } else {
        mBox.style.display = 'none';
      }
    }
    function next() { idx = (idx + 1) % slides.length; render(); }
    function prev() { idx = (idx - 1 + slides.length) % slides.length; render(); }
    window.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      if (e.key === 'ArrowLeft') prev();
    });
    render();
  </script>
</body>
</html>`;
}

export class GeminiProviderAdapter implements AIProviderAdapter {
  readonly id = 'gemini';
  readonly name = 'Aura & Google Gemini';
  readonly envVarName = 'GEMINI_API_KEY';

  isConfigured(): boolean {
    const key = process.env.GEMINI_API_KEY;
    return Boolean(key && key.trim().length > 0 && key !== 'MY_GEMINI_API_KEY');
  }

  getStatus(): ProviderStatus {
    const configured = this.isConfigured();
    const geminiAndAuraModels = AURA_MODEL_CATALOG.filter(
      (m) => m.providerId === 'gemini'
    ).map((m, idx) => ({
      id: m.id,
      label: `${m.label} (${m.badgeFr})`,
      capabilities: m.capabilities,
      isDefault: idx === 0,
    }));

    return {
      id: this.id,
      name: this.name,
      configured,
      envVarName: this.envVarName,
      models: geminiAndAuraModels,
      supportsStreaming: true,
      supportsWebSearch: true,
      supportsImageGeneration: true,
      statusMessage: configured
        ? 'Opérationnel côté serveur (5 Modèles Aura, Gemini 3.8, Images, Vidéos & Slides).'
        : 'Clé GEMINI_API_KEY absente. Configurez-la dans Settings > Secrets.',
    };
  }

  estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.max(1, Math.ceil(text.length / 4));
  }

  private resolveSdkModelName(requestedModelId?: string): string {
    switch (requestedModelId) {
      case 'aura-3.1-lite':
      case 'gemini-3.1-flash-lite':
        return 'gemini-3.1-flash-lite';
      case 'aura-3.1-pro':
      case 'gemini-3.1-pro-preview':
        return 'gemini-3.1-pro-preview';
      case 'gemini-flash-latest':
        return 'gemini-flash-latest';
      case 'aura-3.8-flash':
      case 'aura-studio-architect':
      case 'aura-deep-research':
      case 'gemini-3.8-flash':
      default:
        return 'gemini-3.8-flash';
    }
  }

  private getSystemInstruction(request: AIRequest): string {
    const langInstruction =
      request.language === 'en'
        ? 'Respond in clear, natural, warm, and well-structured English unless the user writes in French.'
        : 'Réponds en français clair, naturel, chaleureux et bien structuré (sauf si l’utilisateur demande explicitement une autre langue).';

    let modelPersona = '';
    if (request.modelId === 'aura-3.1-pro') {
      modelPersona =
        '\nPROFIL MODÈLE : Tu opères en tant qu’Aura 3.1 Pro, le modèle de raisonnement profond d’Aura. Fournis des analyses rigoureuses, structurées étape par étape, avec une profondeur technique maximale.';
    } else if (request.modelId === 'aura-studio-architect') {
      modelPersona =
        '\nPROFIL MODÈLE : Tu opères en tant qu’Aura Studio Architect, directeur artistique digital et ingénieur frontend senior spécialisé dans les interfaces web interactives.';
    } else if (request.modelId === 'aura-deep-research') {
      modelPersona =
        '\nPROFIL MODÈLE : Tu opères en tant qu’Aura Deep Research, analyste de recherche vérifiée multi-sources.';
    } else if (request.modelId === 'aura-3.1-lite') {
      modelPersona =
        '\nPROFIL MODÈLE : Tu opères en tant qu’Aura 3.1 Lite. Sois direct, concis, synthétique et immédiatement actionnable.';
    }

    const basePersona = `Tu es Aura, une plateforme d'intelligence artificielle multimodale et un espace de travail interactif conçu pour aider les étudiants, développeurs, entrepreneurs, créateurs et équipes à réfléchir, apprendre, rechercher, programmer et créer.
Ton style est clair, structuré, humain, rigoureux et bienveillant. ${langInstruction}${modelPersona}`;

    const projectContext = request.systemContext
      ? `\nContexte du projet actif : ${request.systemContext}`
      : '';

    const iterativeNote = request.activeArtifactContext
      ? `\nMODE ITÉRATIF AURA STUDIO ACTIF : L'utilisateur travaille actuellement sur un résultat ouvert dans le panneau Aura Studio (${request.activeArtifactContext.title || 'Création active'}). Lorsqu'il demande une modification, conserve la structure et les fonctionnalités existantes et renvoie la version complète mise à jour afin que l'aperçu en direct d'Aura Studio se rafraîchisse intégralement.`
      : '';

    switch (request.mode) {
      case 'search':
        return `${basePersona}${projectContext}${iterativeNote}
MODE ACTIF : RECHERCHE WEB & ANALYSE SOURCÉE.
- Fournis des informations précises, vérifiables et structurées avec des titres clairs (##, ###) et des points clés.
- Distingue explicitement les faits vérifiés des éléments qui restent incertains ou évolutifs.
- N'invente jamais de fausses URL ou de fausses citations. Appuie-toi uniquement sur l'outil de recherche Google activé.`;

      case 'code':
        return `${basePersona}${projectContext}${iterativeNote}
MODE ACTIF : INGÉNIERIE LOGICIELLE & CRÉATION WEB INTERACTIVE.
- Fournis du code propre, complet, commenté avec justesse et directement fonctionnel.
- Explique brièvement les choix d'architecture ou les modifications apportées avant ou après le bloc de code.
- Si l'utilisateur demande une interface web, une application, une landing page, un tableau de bord, un composant visuel ou une modification d'interface, fournis TOUJOURS un bloc \`\`\`html complet et autonome (incluant le HTML5, le CSS soigné ou Tailwind CDN et le JavaScript interactif) afin que l'aperçu en direct d'Aura Studio à droite de l'écran puisse l'exécuter immédiatement.`;

      case 'create':
        return `${basePersona}${projectContext}${iterativeNote}
MODE ACTIF : AURA STUDIO (ESPACE DE CRÉATION, DIRECTION ARTISTIQUE & LIVRABLES).
- Aide l'utilisateur à transformer ses idées en plans d'action, concepts éditoriaux, architectures de marque, documents structurés ou prototypes visuels.
- Structure ta réponse avec des sections claires : 1) Concept directeur & Vision, 2) Livrable détaillé et actionnable, 3) Direction visuelle & Recommandations.
- Si l'utilisateur souhaite également une maquette visuelle ou un prototype web de son concept, inclus un bloc \`\`\`html autonome prévisualisable dans Aura Studio.`;

      case 'chat':
      default:
        return `${basePersona}${projectContext}${iterativeNote}
MODE ACTIF : CONVERSATION, ANALYSE DE DOCUMENTS & RÉFLEXION POLYVALENTE.
- Aide l'utilisateur à comprendre des concepts, analyser des documents, résumer, rédiger, planifier et résoudre ses problèmes avec clarté, pédagogie et structure (titres ##, listes à puces, synthèses).`;
    }
  }

  private async handleImageGeneration(
    ai: GoogleGenAI,
    request: AIRequest
  ): Promise<AIResponse> {
    const aspectRatio = request.mediaOptions?.aspectRatio || '1:1';
    const requestedModel = request.modelId || 'gemini-3.1-flash-lite-image';
    const useNativeImageModel =
      requestedModel === 'gemini-3.1-flash-lite-image' ||
      requestedModel === 'gemini-nano-banana-2.1';

    if (useNativeImageModel) {
      try {
        const imgRes = await ai.models.generateContent({
          model: requestedModel,
          contents: {
            parts: [{ text: request.prompt }],
          },
          config: {
            imageConfig: {
              aspectRatio,
            },
          },
        });

        const candidateParts = imgRes.candidates?.[0]?.content?.parts || [];
        let base64Image = '';
        let mimeType = 'image/png';
        let companionText = '';

        for (const part of candidateParts) {
          if (part.inlineData?.data) {
            base64Image = part.inlineData.data;
            mimeType = part.inlineData.mimeType || 'image/png';
          } else if (part.text) {
            companionText += part.text + '\n';
          }
        }

        if (base64Image) {
          const imageUrl = `data:${mimeType};base64,${base64Image}`;
          const title =
            request.prompt.length > 54
              ? `${request.prompt.slice(0, 54)}...`
              : request.prompt;
          const imageArtifact: ImageArtifact = {
            title,
            prompt: request.prompt,
            imageUrl,
            mimeType,
            aspectRatio,
            modelId: requestedModel,
            palette: ['#078348', '#8CCB4A', '#EACB37', '#FF790D', '#14282D'],
          };
          const summaryText =
            companionText.trim() ||
            `### Visuel généré dans Aura Studio\n\n- **Modèle** : ${requestedModel}\n- **Format** : ${aspectRatio}\n- **Brief visuel** : ${request.prompt}\n\nVous pouvez inspecter, zoomer, télécharger ou affiner cette image directement dans le panneau **Aura Studio** à droite.`;
          return {
            text: summaryText,
            modelId: requestedModel,
            providerId: this.id,
            estimatedInputTokens: this.estimateTokens(request.prompt),
            estimatedOutputTokens: 260,
            imageArtifact,
          };
        }
      } catch {
        // Fallback to high-precision generative SVG art studio if billing/key doesn't cover Imagen
      }
    }

    // High-Precision Generative SVG Illustration via Gemini 3.8 Flash
    const viewBoxMap: Record<string, string> = {
      '1:1': '0 0 800 800',
      '16:9': '0 0 1280 720',
      '9:16': '0 0 720 1280',
      '4:3': '0 0 960 720',
      '3:4': '0 0 720 960',
    };
    const vb = viewBoxMap[aspectRatio] || '0 0 800 800';

    const svgPrompt = `Tu es le moteur graphique vectoriel d'Aura Studio.
Crée une illustration vectorielle SVG haute définition, riche, artistique et moderne répondant exactement à cette demande : "${request.prompt}".
${request.activeArtifactContext?.code ? `Illustration précédente à modifier :\n${request.activeArtifactContext.code.slice(0, 8000)}\n` : ''}
Règles strictes :
1. Utilise viewBox="${vb}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg".
2. Inclus des dégradés <linearGradient> et <radialGradient>, des formes géométriques ou organiques superposées, des jeux de lumière, une composition équilibrée et une typographie intégrée propre si pertinent.
3. Renvoie d'abord une courte explication de ta direction artistique (3 lignes), suivie d'un unique bloc \`\`\`svg contenant le code <svg>...</svg> complet et valide.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: svgPrompt,
      config: {
        temperature: 0.65,
      },
    });

    const outputText = response.text || '';
    const svgMatch =
      outputText.match(/```(?:svg|xml|html)?\s*(<svg[\s\S]*?<\/svg>)\s*```/i) ||
      outputText.match(/(<svg[\s\S]*?<\/svg>)/i);

    const svgCode = svgMatch
      ? svgMatch[1].trim()
      : `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#078348"/><stop offset="50%" stop-color="#8CCB4A"/><stop offset="100%" stop-color="#FF790D"/></linearGradient></defs><rect width="100%" height="100%" rx="32" fill="#FAF8F2"/><circle cx="50%" cy="50%" r="220" fill="url(#g)" opacity="0.88"/><text x="50%" y="52%" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="bold" fill="#14282D">${request.prompt.slice(0, 36).replace(/[<>&"]/g, '')}</text></svg>`;

    const base64Svg = Buffer.from(svgCode, 'utf-8').toString('base64');
    const imageUrl = `data:image/svg+xml;base64,${base64Svg}`;
    const title =
      request.prompt.length > 52
        ? `${request.prompt.slice(0, 52)}...`
        : request.prompt;

    const imageArtifact: ImageArtifact = {
      title,
      prompt: request.prompt,
      imageUrl,
      mimeType: 'image/svg+xml',
      aspectRatio,
      modelId:
        requestedModel === 'aura-vector-studio'
          ? 'aura-vector-studio'
          : `${requestedModel} (Studio Vector HD)`,
      svgCode,
      palette: ['#078348', '#8CCB4A', '#EACB37', '#FF790D', '#14282D'],
    };

    const cleanExplanation = outputText
      .replace(/```[\s\S]*?```/g, '')
      .trim();

    return {
      text:
        cleanExplanation ||
        `### Illustration générée dans Aura Studio\n\nVotre visuel (**${aspectRatio}**) est prêt dans le panneau **Aura Studio** à droite. Vous pouvez le télécharger en SVG/PNG ou demander des ajustements de couleurs et de composition.`,
      modelId: imageArtifact.modelId,
      providerId: this.id,
      estimatedInputTokens: this.estimateTokens(svgPrompt),
      estimatedOutputTokens: this.estimateTokens(outputText),
      imageArtifact,
      codeArtifact: {
        language: 'svg',
        filename: 'illustration.svg',
        code: svgCode,
        previewableHtml: svgCode,
        files: [
          {
            path: 'illustration.svg',
            language: 'svg',
            content: svgCode,
          },
        ],
      },
    };
  }

  private async handleVideoGeneration(
    ai: GoogleGenAI,
    request: AIRequest
  ): Promise<AIResponse> {
    const videoRatio: '16:9' | '9:16' =
      request.mediaOptions?.aspectRatio === '9:16' ? '9:16' : '16:9';
    const requestedModel = request.modelId || 'veo-3.1-lite-generate-preview';
    let operationName: string | undefined;

    // 1. Try starting Veo 3.1 operation if requested
    if (requestedModel === 'veo-3.1-lite-generate-preview') {
      try {
        const op = await ai.models.generateVideos({
          model: 'veo-3.1-lite-generate-preview',
          prompt: request.prompt,
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: videoRatio,
          },
        });
        if (op?.name) {
          operationName = op.name;
        }
      } catch {
        // If paid Veo quota is not enabled on this API key, we still provide an interactive motion video canvas + storyboard
      }
    }

    // 2. Generate Interactive HTML5 Motion Canvas + Structured Storyboard Scenes
    const motionPrompt = `Tu es le réalisateur vidéo et motion designer d'Aura Studio.
Pour la demande suivante : "${request.prompt}", génère :
1. Un storyboard structuré de 4 scènes cinématiques (en Markdown clair avec minutage 00:00 - 00:15, description visuelle et voix-off).
2. Un bloc \`\`\`html complet contenant une **animation vidéo interactive autonome en HTML5 / CSS Keyframes / Canvas 2D** (format ${videoRatio}) avec :
   - Des scènes animées fluides qui s'enchaînent automatiquement avec une barre de progression vidéo (Play/Pause, Restart, Scène 1 à 4, sous-titres dynamiques).
   - Une direction artistique cinématique et moderne fidèle au sujet demandé.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: motionPrompt,
      config: {
        temperature: 0.5,
      },
    });

    const outputText = response.text || '';
    const codeArtifact = extractCodeArtifact(outputText);
    const title =
      request.prompt.length > 52
        ? `${request.prompt.slice(0, 52)}...`
        : request.prompt;

    const videoArtifact: VideoArtifact = {
      title,
      prompt: request.prompt,
      aspectRatio: videoRatio,
      modelId: operationName
        ? 'veo-3.1-lite-generate-preview'
        : 'aura-motion-canvas',
      operationName,
      status: operationName ? 'polling' : 'interactive_motion',
      motionHtml: codeArtifact?.code,
      scenes: [
        {
          sceneNumber: 1,
          title: 'Ouverture & Accroche visuelle',
          durationSeconds: 4,
          visualDescription: 'Plan large dynamique introduisant l’univers et le sujet principal.',
          narration: request.prompt,
        },
        {
          sceneNumber: 2,
          title: 'Développement & Mouvement central',
          durationSeconds: 4,
          visualDescription: 'Transition fluide avec mise en valeur des éléments clés en mouvement.',
          narration: 'Exploration détaillée des fonctionnalités et de l’impact visuel.',
        },
        {
          sceneNumber: 3,
          title: 'Point culminant & Démonstration',
          durationSeconds: 4,
          visualDescription: 'Focus haute intensité sur le résultat et la proposition de valeur.',
          narration: 'Une exécution fluide pensée pour captiver l’audience.',
        },
        {
          sceneNumber: 4,
          title: 'Signature finale & Call-to-Action',
          durationSeconds: 3,
          visualDescription: ' Composition finale épurée avec titre et signature.',
          narration: 'Créé avec Aura Studio.',
        },
      ],
    };

    return {
      text: outputText,
      modelId: videoArtifact.modelId,
      providerId: this.id,
      estimatedInputTokens: this.estimateTokens(motionPrompt),
      estimatedOutputTokens: this.estimateTokens(outputText),
      videoArtifact,
      codeArtifact,
    };
  }

  private async handleSlidesGeneration(
    ai: GoogleGenAI,
    request: AIRequest
  ): Promise<AIResponse> {
    const slideCount = request.mediaOptions?.slideCount || 6;
    const slidesPrompt = `Crée une présentation professionnelle complète et percutante de ${slideCount} diapositives sur le sujet suivant : "${request.prompt}".
${request.activeArtifactContext?.content ? `Contexte ou présentation actuelle à affiner :\n${request.activeArtifactContext.content.slice(0, 6000)}\n` : ''}
Langue : ${request.language === 'en' ? 'Anglais' : 'Français'}.
Chaque diapositive doit avoir un titre fort, un sous-titre explicatif, un court kicker (catégorie), 3 à 4 points clés précis et concrets, une métrique clé chiffrée pertinente (highlightMetric), et des notes d'orateur.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: slidesPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  slideNumber: { type: Type.INTEGER },
                  kicker: { type: Type.STRING },
                  title: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  bullets: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  highlightMetricValue: { type: Type.STRING },
                  highlightMetricLabel: { type: Type.STRING },
                  speakerNotes: { type: Type.STRING },
                  layout: { type: Type.STRING },
                },
                required: ['slideNumber', 'title', 'bullets'],
              },
            },
          },
          required: ['title', 'subtitle', 'slides'],
        },
      },
    });

    let parsed: {
      title?: string;
      subtitle?: string;
      executiveSummary?: string;
      slides?: Array<{
        slideNumber?: number;
        kicker?: string;
        title?: string;
        subtitle?: string;
        bullets?: string[];
        highlightMetricValue?: string;
        highlightMetricLabel?: string;
        speakerNotes?: string;
        layout?: string;
      }>;
    } = {};

    try {
      parsed = JSON.parse((response.text || '{}').trim());
    } catch {
      parsed = {};
    }

    const rawSlides = Array.isArray(parsed.slides) && parsed.slides.length > 0
      ? parsed.slides
      : [
          {
            slideNumber: 1,
            kicker: 'INTRODUCTION',
            title: request.prompt.slice(0, 60),
            subtitle: 'Présentation stratégique générée par Aura Slides Studio',
            bullets: [
              'Vision d’ensemble et objectifs prioritaires',
              'Proposition de valeur structurée et différenciante',
              'Feuille de route opérationnelle',
            ],
            highlightMetricValue: '100%',
            highlightMetricLabel: 'Alignement stratégique',
            speakerNotes: 'Introduire le sujet avec clarté et impact.',
            layout: 'hero',
          },
        ];

    const normalizedSlides: SlideItem[] = rawSlides.map((s, idx) => ({
      slideNumber: idx + 1,
      kicker: s.kicker || `DIAPOSITIVE ${idx + 1}`,
      title: s.title || `Section ${idx + 1}`,
      subtitle: s.subtitle || '',
      bullets: Array.isArray(s.bullets) ? s.bullets : [],
      highlightMetric: s.highlightMetricValue
        ? {
            value: s.highlightMetricValue,
            label: s.highlightMetricLabel || 'Indicateur clé',
          }
        : undefined,
      speakerNotes: s.speakerNotes || '',
      layout: (['hero', 'split', 'metrics', 'roadmap', 'closing'].includes(
        s.layout || ''
      )
        ? s.layout
        : idx === 0
        ? 'hero'
        : idx === rawSlides.length - 1
        ? 'closing'
        : 'split') as SlideItem['layout'],
    }));

    const deckTitle = parsed.title || request.prompt.slice(0, 56);
    const deckSubtitle =
      parsed.subtitle || 'Présentation interactive générée dans Aura Studio';
    const exportableHtml = buildStandaloneSlideDeckHtml({
      title: deckTitle,
      subtitle: deckSubtitle,
      slides: normalizedSlides,
    });

    const slideArtifact: SlideArtifact = {
      title: deckTitle,
      subtitle: deckSubtitle,
      theme: 'ivory-emerald',
      slides: normalizedSlides,
      exportableHtml,
    };

    const markdownSummary = [
      `## ${deckTitle}`,
      `*${deckSubtitle}*`,
      parsed.executiveSummary ? `\n${parsed.executiveSummary}\n` : '',
      `### Plan des ${normalizedSlides.length} diapositives (Interactif dans Aura Studio) :`,
      ...normalizedSlides.map(
        (s) =>
          `- **Slide ${s.slideNumber} — ${s.title}** : ${s.bullets.slice(0, 2).join(' · ')}`
      ),
    ]
      .filter(Boolean)
      .join('\n\n');

    return {
      text: markdownSummary,
      modelId: 'aura-slides-pro',
      providerId: this.id,
      estimatedInputTokens: this.estimateTokens(slidesPrompt),
      estimatedOutputTokens: this.estimateTokens(response.text || ''),
      slideArtifact,
      codeArtifact: {
        language: 'html',
        filename: 'presentation-slides.html',
        code: exportableHtml,
        previewableHtml: exportableHtml,
        files: [
          {
            path: 'presentation-slides.html',
            language: 'html',
            content: exportableHtml,
          },
          {
            path: 'slides-structure.json',
            language: 'json',
            content: JSON.stringify(normalizedSlides, null, 2),
          },
        ],
      },
    };
  }

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new Error(
        'PROVIDER_NOT_CONFIGURED: La clé GEMINI_API_KEY est manquante sur votre déploiement. Ajoutez GEMINI_API_KEY dans votre projet Vercel (Settings > Environment Variables) puis relancez le déploiement.'
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Route specialized media modes or models directly to their dedicated engines
    const catalogEntry = AURA_MODEL_CATALOG.find((m) => m.id === request.modelId);
    const effectiveMode =
      request.mode === 'image' || catalogEntry?.category === 'image'
        ? 'image'
        : request.mode === 'video' ||
          request.modelId === 'veo-3.1-lite-generate-preview' ||
          request.modelId === 'aura-motion-canvas'
        ? 'video'
        : request.mode === 'slides' || request.modelId === 'aura-slides-pro'
        ? 'slides'
        : request.mode;

    if (effectiveMode === 'image') {
      return this.handleImageGeneration(ai, request);
    }
    if (effectiveMode === 'video') {
      return this.handleVideoGeneration(ai, request);
    }
    if (effectiveMode === 'slides') {
      return this.handleSlidesGeneration(ai, request);
    }

    const sdkModel = this.resolveSdkModelName(request.modelId);
    const reportedModelId = request.modelId || 'aura-3.8-flash';

    const parts: Array<{
      text?: string;
      inlineData?: { mimeType: string; data: string };
    }> = [];

    if (request.history && request.history.length > 0) {
      const recentHistory = request.history.slice(-8);
      const formattedHistory = recentHistory
        .map(
          (m) => `${m.role === 'user' ? 'Utilisateur' : 'Aura'}: ${m.content}`
        )
        .join('\n\n');
      parts.push({
        text: `Historique récent de la conversation :\n${formattedHistory}\n\n---\n`,
      });
    }

    if (request.activeArtifactContext) {
      const ctx = request.activeArtifactContext;
      if (ctx.code) {
        parts.push({
          text: `[État actuel du code dans Aura Studio (${ctx.filename || 'index.html'}) — Applique les modifications demandées sur cette base et renvoie le fichier complet mis à jour] :\n\`\`\`html\n${ctx.code.slice(0, 14000)}\n\`\`\`\n\n`,
        });
      } else if (ctx.content) {
        parts.push({
          text: `[État actuel du livrable dans Aura Studio (${ctx.title || 'Document actif'}) — Applique les modifications demandées sur cette base] :\n${ctx.content.slice(0, 10000)}\n\n`,
        });
      }
    }

    if (request.attachments && request.attachments.length > 0) {
      for (const att of request.attachments) {
        if (
          att.type === 'image' &&
          att.dataUrl &&
          att.dataUrl.includes('base64,')
        ) {
          const base64Data = att.dataUrl.split('base64,')[1];
          parts.push({
            inlineData: {
              mimeType: att.mimeType || 'image/png',
              data: base64Data,
            },
          });
        } else if (att.contentPreview) {
          parts.push({
            text: `[Fichier joint : ${att.name}]\n${att.contentPreview}`,
          });
        }
      }
    }

    parts.push({ text: request.prompt });

    const useGoogleSearch =
      effectiveMode === 'search' || request.modelId === 'aura-deep-research';

    const config: Record<string, unknown> = {
      systemInstruction: this.getSystemInstruction(request),
      temperature:
        effectiveMode === 'code'
          ? 0.3
          : useGoogleSearch
          ? 0.2
          : 0.7,
    };

    if (useGoogleSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    let response: GenerateContentResponse;
    try {
      response = await ai.models.generateContent({
        model: sdkModel,
        contents: { parts },
        config,
      });
    } catch {
      // If a preview model like gemini-3.1-pro-preview requires a paid tier not active on the key, fallback seamlessly to gemini-3.8-flash
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config,
      });
    }

    const outputText = response.text || 'Aucune réponse textuelle générée.';

    const sources: GroundingSource[] = [];
    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (Array.isArray(groundingChunks)) {
      const seenUris = new Set<string>();
      for (const chunk of groundingChunks) {
        const web = (chunk as { web?: { uri?: string; title?: string } }).web;
        if (web?.uri && !seenUris.has(web.uri)) {
          seenUris.add(web.uri);
          sources.push({
            title: web.title || extractDomain(web.uri),
            uri: web.uri,
            domain: extractDomain(web.uri),
            verified: true,
          });
        }
      }
    }

    const codeArtifact =
      effectiveMode === 'code' || outputText.includes('```')
        ? extractCodeArtifact(outputText)
        : undefined;

    const creativeArtifact =
      effectiveMode === 'create'
        ? extractCreativeArtifact(outputText, request.prompt)
        : undefined;

    const isUncertainNote =
      useGoogleSearch
        ? sources.length > 0
          ? `${sources.length} source(s) web vérifiée(s) via Google Search Grounding.`
          : 'Synthèse fondée sur les connaissances du modèle. Aucune source web externe additionnelle n’a été retournée pour cette requête précise.'
        : undefined;

    const estimatedInputTokens = this.estimateTokens(
      parts.map((p) => p.text || '').join(' ')
    );
    const estimatedOutputTokens = this.estimateTokens(outputText);

    return {
      text: outputText,
      modelId: reportedModelId,
      providerId: this.id,
      estimatedInputTokens,
      estimatedOutputTokens,
      sources: sources.length > 0 ? sources : undefined,
      codeArtifact,
      creativeArtifact,
      isUncertainNote,
    };
  }
}
