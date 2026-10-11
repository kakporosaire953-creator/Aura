import { AIProviderAdapter, AIRequest, AIResponse } from './types.ts';
import { ProviderStatus } from '../../shared/types.ts';
import { GeminiProviderAdapter } from './geminiAdapter.ts';

export class OpenAIProviderAdapter implements AIProviderAdapter {
  readonly id = 'openai';
  readonly name = 'OpenAI';
  readonly envVarName = 'OPENAI_API_KEY';

  isConfigured(): boolean {
    const key = process.env.OPENAI_API_KEY;
    return Boolean(key && key.trim().length > 0);
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
          id: 'gpt-4o',
          label: 'GPT-4o (Adaptateur Externe)',
          capabilities: ['chat', 'code', 'create'],
        },
      ],
      supportsStreaming: true,
      supportsWebSearch: false,
      supportsImageGeneration: true,
      statusMessage: configured
        ? 'Clé OPENAI_API_KEY détectée et prête.'
        : 'Adaptateur prêt — définissez OPENAI_API_KEY dans l’environnement serveur pour activer GPT-4o.',
    };
  }

  estimateTokens(text: string): number {
    return Math.max(1, Math.ceil((text || '').length / 4));
  }

  async generateCompletion(_request: AIRequest): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new Error(
        'PROVIDER_NOT_CONFIGURED: Le fournisseur OpenAI nécessite la variable d’environnement OPENAI_API_KEY côté serveur.'
      );
    }
    throw new Error('Adaptateur externe OpenAI sélectionné sans passerelle active.');
  }
}

export class AnthropicProviderAdapter implements AIProviderAdapter {
  readonly id = 'anthropic';
  readonly name = 'Anthropic Claude';
  readonly envVarName = 'ANTHROPIC_API_KEY';

  isConfigured(): boolean {
    const key = process.env.ANTHROPIC_API_KEY;
    return Boolean(key && key.trim().length > 0);
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
          id: 'claude-3-7-sonnet',
          label: 'Claude 3.7 Sonnet (Adaptateur Externe)',
          capabilities: ['chat', 'code', 'create'],
        },
      ],
      supportsStreaming: true,
      supportsWebSearch: false,
      supportsImageGeneration: false,
      statusMessage: configured
        ? 'Clé ANTHROPIC_API_KEY détectée et prête.'
        : 'Adaptateur prêt — définissez ANTHROPIC_API_KEY dans l’environnement serveur pour activer Claude.',
    };
  }

  estimateTokens(text: string): number {
    return Math.max(1, Math.ceil((text || '').length / 4));
  }

  async generateCompletion(_request: AIRequest): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new Error(
        'PROVIDER_NOT_CONFIGURED: Le fournisseur Anthropic nécessite la variable d’environnement ANTHROPIC_API_KEY côté serveur.'
      );
    }
    throw new Error('Adaptateur externe Anthropic sélectionné sans passerelle active.');
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

  getAdapter(providerId?: string): AIProviderAdapter {
    if (providerId && this.adapters.has(providerId)) {
      const requested = this.adapters.get(providerId)!;
      if (requested.isConfigured()) {
        return requested;
      }
      throw new Error(
        `Le fournisseur « ${requested.name} » n'est pas encore configuré sur le serveur (variable requise : ${requested.envVarName}). Sélectionnez Google Gemini ou configurez la clé correspondante.`
      );
    }

    const gemini = this.adapters.get('gemini')!;
    if (gemini.isConfigured()) {
      return gemini;
    }

    for (const adapter of this.adapters.values()) {
      if (adapter.isConfigured()) return adapter;
    }

    return gemini;
  }
}

export const aiRegistry = new MultiProviderRegistry();
