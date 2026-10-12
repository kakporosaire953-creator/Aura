import { AIProviderAdapter, AIRequest, AIResponse } from './types.ts';
import { AURA_MODEL_CATALOG, ProviderStatus } from '../../shared/types.ts';
import {
  GeminiProviderAdapter,
  extractCodeArtifact,
  extractCreativeArtifact,
} from './geminiAdapter.ts';

export class OpenAIProviderAdapter implements AIProviderAdapter {
  readonly id = 'openai';
  readonly name = 'OpenAI (GPT-4o mini / o3-mini / GPT-4o)';
  readonly envVarName = 'OPENAI_API_KEY';

  private geminiFallback = new GeminiProviderAdapter();

  isConfigured(): boolean {
    const key = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    return Boolean(key && key.trim().length > 0) || this.geminiFallback.isConfigured();
  }

  hasDirectKey(): boolean {
    const key = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    return Boolean(key && key.trim().length > 0);
  }

  getStatus(): ProviderStatus {
    const direct = this.hasDirectKey();
    const relayReady = this.geminiFallback.isConfigured();
    const models = AURA_MODEL_CATALOG.filter((m) => m.providerId === 'openai').map(
      (m, idx) => ({
        id: m.id,
        label: `${m.label} (${m.badgeFr})`,
        capabilities: m.capabilities,
        isDefault: idx === 0,
      })
    );

    return {
      id: this.id,
      name: this.name,
      configured: direct || relayReady,
      envVarName: this.envVarName,
      models,
      supportsStreaming: true,
      supportsWebSearch: false,
      supportsImageGeneration: true,
      statusMessage: direct
        ? 'Clé OPENAI_API_KEY / OPENROUTER_API_KEY active.'
        : 'Actif via relais intelligent Aura (ou ajoutez OPENAI_API_KEY pour appel direct).',
    };
  }

  estimateTokens(text: string): number {
    return Math.max(1, Math.ceil((text || '').length / 4));
  }

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    const openAiKey = process.env.OPENAI_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const modelId = request.modelId || 'gpt-4o-mini';

    // If media mode (image, video, slides) is requested while an OpenAI model is selected, delegate to Aura Studio engine
    if (['image', 'video', 'slides'].includes(request.mode)) {
      return this.geminiFallback.generateCompletion(request);
    }

    if (openAiKey || openRouterKey) {
      try {
        const endpoint = openAiKey
          ? 'https://api.openai.com/v1/chat/completions'
          : 'https://openrouter.ai/api/v1/chat/completions';
        const apiKey = openAiKey || openRouterKey!;
        const targetModel = openAiKey
          ? modelId
          : modelId === 'gpt-4o-mini'
          ? 'openai/gpt-4o-mini'
          : modelId === 'o3-mini'
          ? 'openai/o3-mini'
          : 'openai/gpt-4o';

        const messages = [
          {
            role: 'system',
            content:
              'Tu es Aura propulsé par OpenAI. Réponds avec clarté, rigueur et structure. Si l’utilisateur demande une interface web, fournis un bloc ```html complet et autonome.',
          },
          ...(request.history || []).slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          {
            role: 'user',
            content: request.prompt,
          },
        ];

        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: targetModel,
            messages,
          }),
        });

        if (resp.ok) {
          const data = (await resp.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const outputText =
            data.choices?.[0]?.message?.content ||
            'Aucune réponse générée.';
          return {
            text: outputText,
            modelId,
            providerId: this.id,
            estimatedInputTokens: this.estimateTokens(request.prompt),
            estimatedOutputTokens: this.estimateTokens(outputText),
            codeArtifact:
              request.mode === 'code' || outputText.includes('```')
                ? extractCodeArtifact(outputText)
                : undefined,
            creativeArtifact:
              request.mode === 'create'
                ? extractCreativeArtifact(outputText, request.prompt)
                : undefined,
          };
        }
      } catch {
        // Fallback to Aura Gemini relay below
      }
    }

    const fallbackRes = await this.geminiFallback.generateCompletion({
      ...request,
      modelId: 'gemini-3.8-flash',
    });

    return {
      ...fallbackRes,
      modelId,
      providerId: this.id,
      isUncertainNote:
        fallbackRes.isUncertainNote ||
        `Exécuté via le relais gratuit Aura (${modelId}).`,
    };
  }
}

export class AnthropicProviderAdapter implements AIProviderAdapter {
  readonly id = 'anthropic';
  readonly name = 'Anthropic Claude (3.5 Haiku / 3.7 Sonnet)';
  readonly envVarName = 'ANTHROPIC_API_KEY';

  private geminiFallback = new GeminiProviderAdapter();

  isConfigured(): boolean {
    const key = process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY;
    return Boolean(key && key.trim().length > 0) || this.geminiFallback.isConfigured();
  }

  hasDirectKey(): boolean {
    const key = process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY;
    return Boolean(key && key.trim().length > 0);
  }

  getStatus(): ProviderStatus {
    const direct = this.hasDirectKey();
    const relayReady = this.geminiFallback.isConfigured();
    const models = AURA_MODEL_CATALOG.filter(
      (m) => m.providerId === 'anthropic'
    ).map((m, idx) => ({
      id: m.id,
      label: `${m.label} (${m.badgeFr})`,
      capabilities: m.capabilities,
      isDefault: idx === 0,
    }));

    return {
      id: this.id,
      name: this.name,
      configured: direct || relayReady,
      envVarName: this.envVarName,
      models,
      supportsStreaming: true,
      supportsWebSearch: false,
      supportsImageGeneration: false,
      statusMessage: direct
        ? 'Clé ANTHROPIC_API_KEY / OPENROUTER_API_KEY active.'
        : 'Actif via relais intelligent Aura (ou ajoutez ANTHROPIC_API_KEY pour appel direct).',
    };
  }

  estimateTokens(text: string): number {
    return Math.max(1, Math.ceil((text || '').length / 4));
  }

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const modelId = request.modelId || 'claude-3-5-haiku';

    if (['image', 'video', 'slides'].includes(request.mode)) {
      return this.geminiFallback.generateCompletion(request);
    }

    if (anthropicKey) {
      try {
        const targetModel =
          modelId === 'claude-3-5-haiku'
            ? 'claude-3-5-haiku-latest'
            : 'claude-3-7-sonnet-latest';
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: targetModel,
            max_tokens: 4096,
            system:
              'Tu es Aura propulsé par Anthropic Claude. Fournis des réponses structurées et du code HTML/CSS/JS autonome complet lorsque l’utilisateur demande une interface.',
            messages: [
              ...(request.history || []).slice(-6).map((m) => ({
                role: m.role,
                content: m.content,
              })),
              { role: 'user', content: request.prompt },
            ],
          }),
        });

        if (resp.ok) {
          const data = (await resp.json()) as {
            content?: Array<{ text?: string }>;
          };
          const outputText =
            data.content?.[0]?.text || 'Aucune réponse générée.';
          return {
            text: outputText,
            modelId,
            providerId: this.id,
            estimatedInputTokens: this.estimateTokens(request.prompt),
            estimatedOutputTokens: this.estimateTokens(outputText),
            codeArtifact:
              request.mode === 'code' || outputText.includes('```')
                ? extractCodeArtifact(outputText)
                : undefined,
            creativeArtifact:
              request.mode === 'create'
                ? extractCreativeArtifact(outputText, request.prompt)
                : undefined,
          };
        }
      } catch {
        // Fallback to Aura Gemini relay below
      }
    } else if (openRouterKey) {
      try {
        const targetModel =
          modelId === 'claude-3-5-haiku'
            ? 'anthropic/claude-3.5-haiku'
            : 'anthropic/claude-3.7-sonnet';
        const resp = await fetch(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openRouterKey}`,
            },
            body: JSON.stringify({
              model: targetModel,
              messages: [
                {
                  role: 'user',
                  content: request.prompt,
                },
              ],
            }),
          }
        );
        if (resp.ok) {
          const data = (await resp.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const outputText =
            data.choices?.[0]?.message?.content || 'Aucune réponse générée.';
          return {
            text: outputText,
            modelId,
            providerId: this.id,
            estimatedInputTokens: this.estimateTokens(request.prompt),
            estimatedOutputTokens: this.estimateTokens(outputText),
            codeArtifact:
              request.mode === 'code' || outputText.includes('```')
                ? extractCodeArtifact(outputText)
                : undefined,
            creativeArtifact:
              request.mode === 'create'
                ? extractCreativeArtifact(outputText, request.prompt)
                : undefined,
          };
        }
      } catch {
        // Fallback below
      }
    }

    const fallbackRes = await this.geminiFallback.generateCompletion({
      ...request,
      modelId: 'gemini-3.8-flash',
    });

    return {
      ...fallbackRes,
      modelId,
      providerId: this.id,
      isUncertainNote:
        fallbackRes.isUncertainNote ||
        `Exécuté via le relais gratuit Aura (${modelId}).`,
    };
  }
}

export class MultiProviderRegistry {
  private adapters: Map<string, AIProviderAdapter> = new Map();

  constructor() {
    const gemini = new GeminiProviderAdapter();
    const openai = new OpenAIProviderAdapter();
    const anthropic = new AnthropicProviderAdapter();

    this.adapters.set(gemini.id, gemini);
    this.adapters.set(openai.id, openai);
    this.adapters.set(anthropic.id, anthropic);
  }

  getAllStatuses(): ProviderStatus[] {
    return Array.from(this.adapters.values()).map((a) => a.getStatus());
  }

  getAdapter(providerId?: string, modelId?: string): AIProviderAdapter {
    // Automatically infer provider from model catalog if modelId is specified
    if (modelId) {
      const catalogItem = AURA_MODEL_CATALOG.find((m) => m.id === modelId);
      if (catalogItem && this.adapters.has(catalogItem.providerId)) {
        return this.adapters.get(catalogItem.providerId)!;
      }
    }

    if (providerId && this.adapters.has(providerId)) {
      return this.adapters.get(providerId)!;
    }

    return this.adapters.get('gemini')!;
  }
}

export const aiRegistry = new MultiProviderRegistry();
