import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import {
  AIProviderAdapter,
  AIRequest,
  AIResponse,
} from './types.ts';
import {
  CodeArtifact,
  CreativeArtifact,
  GroundingSource,
  ProviderStatus,
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

function extractCodeArtifact(markdown: string): CodeArtifact | undefined {
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const matches = [...markdown.matchAll(codeBlockRegex)];
  if (matches.length === 0) return undefined;

  // Prefer HTML or complete web code block if present, otherwise first substantial block
  const htmlMatch = matches.find((m) =>
    ['html', 'htm', 'svg'].includes((m[1] || '').toLowerCase())
  );
  const chosen = htmlMatch || matches[0];
  const lang = (chosen[1] || 'typescript').toLowerCase();
  const code = chosen[2].trim();

  const extMap: Record<string, string> = {
    html: 'index.html',
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
    code.includes('<!DOCTYPE html>') ||
    code.includes('<html') ||
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

  // If single self-contained HTML file, also surface embedded <style> and <script> in the Studio file explorer
  if (files.length === 1 && isPreviewable) {
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

function extractCreativeArtifact(text: string, prompt: string): CreativeArtifact {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const firstHeading = lines.find((l) => l.startsWith('#'))?.replace(/^#+\s*/, '');
  const title = firstHeading || (prompt.length > 48 ? `${prompt.slice(0, 48)}...` : prompt);

  // Extract bullet items for key elements
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

export class GeminiProviderAdapter implements AIProviderAdapter {
  readonly id = 'gemini';
  readonly name = 'Google Gemini';
  readonly envVarName = 'GEMINI_API_KEY';

  isConfigured(): boolean {
    const key = process.env.GEMINI_API_KEY;
    return Boolean(key && key.trim().length > 0 && key !== 'MY_GEMINI_API_KEY');
  }

  getStatus(): ProviderStatus {
    const configured = this.isConfigured();
    return {
      id: this.id,
      name: this.name,
      configured,
      envVarName: this.envVarName,
      models: [
        {
          id: 'gemini-3.8-flash',
          label: 'Aura Flash (Gemini 3.8 Flash)',
          capabilities: ['chat', 'search', 'code', 'create'],
          isDefault: true,
        },
        {
          id: 'gemini-3.1-flash-lite',
          label: 'Aura Lite (Gemini 3.1 Flash Lite)',
          capabilities: ['chat', 'code', 'create'],
        },
      ],
      supportsStreaming: true,
      supportsWebSearch: true,
      supportsImageGeneration: false,
      statusMessage: configured
        ? 'Opérationnel côté serveur (Chat, Recherche Google Grounding, Code, Créer).'
        : 'Clé GEMINI_API_KEY absente. Configurez-la dans Settings > Secrets.',
    };
  }

  estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.max(1, Math.ceil(text.length / 4));
  }

  private getSystemInstruction(request: AIRequest): string {
    const langInstruction =
      request.language === 'en'
        ? 'Respond in clear, natural, warm, and well-structured English unless the user writes in French.'
        : 'Réponds en français clair, naturel, chaleureux et bien structuré (sauf si l’utilisateur demande explicitement une autre langue).';

    const basePersona = `Tu es Aura, une plateforme d'intelligence artificielle multimodale et un espace de travail interactif conçu pour aider les étudiants, développeurs, entrepreneurs, créateurs et équipes (notamment en Afrique francophone et à l'international) à réfléchir, apprendre, rechercher, programmer et créer.
Ton style est clair, structuré, humain, rigoureux et bienveillant. ${langInstruction}`;

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

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new Error(
        'PROVIDER_NOT_CONFIGURED: La clé GEMINI_API_KEY n’est pas configurée sur le serveur.'
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

    const activeModel =
      request.modelId &&
      ['gemini-3.8-flash', 'gemini-3.1-flash-lite'].includes(request.modelId)
        ? request.modelId
        : 'gemini-3.8-flash';

    // Build multimodal or multi-turn contents
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

    const config: Record<string, unknown> = {
      systemInstruction: this.getSystemInstruction(request),
      temperature:
        request.mode === 'code' ? 0.3 : request.mode === 'search' ? 0.2 : 0.7,
    };

    if (request.mode === 'search') {
      config.tools = [{ googleSearch: {} }];
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: activeModel,
      contents: { parts },
      config,
    });

    const outputText = response.text || 'Aucune réponse textuelle générée.';

    // Extract Google Search Grounding sources if in search mode or if grounding metadata is returned
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
      request.mode === 'code' || outputText.includes('```')
        ? extractCodeArtifact(outputText)
        : undefined;

    const creativeArtifact =
      request.mode === 'create'
        ? extractCreativeArtifact(outputText, request.prompt)
        : undefined;

    const isUncertainNote =
      request.mode === 'search'
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
      modelId: activeModel,
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
