import {
  AURA_MODEL_CATALOG,
  AttachmentItem,
  AuraLanguage,
  AuraMode,
  CatalogModelDefinition,
  Conversation,
  ModelCategory,
  ProviderStatus,
  UsageMetrics,
} from '../shared/types';

const SESSION_TOKEN_KEY = 'aura_session_token_v2';

export type ExecutionRouteType = 'direct' | 'openrouter' | 'aura-relay' | 'unconfigured';

export interface ResolvedModelRoute {
  requestedModelId: string;
  effectiveModelId: string;
  providerId: 'gemini' | 'openai' | 'anthropic' | 'openrouter';
  effectiveMode: AuraMode;
  routeType: ExecutionRouteType;
  catalogEntry: CatalogModelDefinition;
  isConfigured: boolean;
  statusNoteFr: string;
  statusNoteEn: string;
}

export interface EnrichedCatalogModel extends CatalogModelDefinition {
  routeType: ExecutionRouteType;
  isAvailable: boolean;
  statusNoteFr: string;
  statusNoteEn: string;
}

export interface SendAIRequestParams {
  conversationId?: string;
  projectId?: string;
  message: string;
  mode?: AuraMode;
  modelId?: string;
  providerId?: string;
  language?: AuraLanguage;
  attachments?: AttachmentItem[];
  mediaOptions?: {
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    slideCount?: number;
    videoDurationSeconds?: number;
    stylePreset?: string;
  };
  activeArtifactContext?: {
    title?: string;
    mode?: AuraMode;
    filename?: string;
    code?: string;
    content?: string;
  };
}

export interface SendAIResponseResult {
  conversation: Conversation;
  usage?: UsageMetrics;
  route: ResolvedModelRoute;
}

export interface VideoStatusResult {
  done: boolean;
  videoUrl?: string;
  error?: string;
}

function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function buildAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getStoredAuthToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  timeoutMs = 60000,
  retries = 1
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 450 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

/**
 * Inspects a model ID (Aura native, Gemini, OpenAI GPT, Anthropic Claude, or Media engine)
 * and resolves the optimal provider route based on the configured server API keys.
 */
export function resolveModelRouting(params: {
  modelId?: string;
  providerId?: string;
  mode?: AuraMode;
  providers?: ProviderStatus[];
}): ResolvedModelRoute {
  const requestedId = (params.modelId || 'aura-3.8-flash').trim();
  const requestedMode: AuraMode = params.mode || 'chat';

  // Find catalog entry or fallback to default Aura 3.8 Flash
  const catalogEntry =
    AURA_MODEL_CATALOG.find((m) => m.id === requestedId) ||
    AURA_MODEL_CATALOG.find(
      (m) => requestedMode !== 'chat' && m.defaultMode === requestedMode
    ) ||
    AURA_MODEL_CATALOG[0];

  // Determine effective mode: if the user picked a dedicated media model (Image/Video/Slides),
  // align the execution mode automatically unless already in a compatible mode
  const effectiveMode: AuraMode =
    catalogEntry.defaultMode &&
    ['image', 'video', 'slides'].includes(catalogEntry.defaultMode)
      ? catalogEntry.defaultMode
      : requestedMode;

  const providers = params.providers || [];
  const geminiStatus = providers.find((p) => p.id === 'gemini');
  const openaiStatus = providers.find((p) => p.id === 'openai');
  const anthropicStatus = providers.find((p) => p.id === 'anthropic');

  const geminiConfigured = geminiStatus ? geminiStatus.configured : true;

  // Check if OpenAI or Anthropic have direct keys vs Aura Gemini relay
  const openaiDirect = Boolean(
    openaiStatus?.configured &&
      openaiStatus.statusMessage &&
      !openaiStatus.statusMessage.toLowerCase().includes('relais')
  );
  const anthropicDirect = Boolean(
    anthropicStatus?.configured &&
      anthropicStatus.statusMessage &&
      !anthropicStatus.statusMessage.toLowerCase().includes('relais')
  );

  // Media modes (Image, Video, Slides) always route through the specialized Gemini / Aura Media Studio engine
  if (['image', 'video', 'slides'].includes(effectiveMode)) {
    return {
      requestedModelId: requestedId,
      effectiveModelId: catalogEntry.id,
      providerId: 'gemini',
      effectiveMode,
      routeType: geminiConfigured ? 'direct' : 'unconfigured',
      catalogEntry,
      isConfigured: geminiConfigured,
      statusNoteFr: geminiConfigured
        ? `Moteur multimédia Aura (${catalogEntry.label}) actif`
        : 'Clé GEMINI_API_KEY requise pour le moteur multimédia',
      statusNoteEn: geminiConfigured
        ? `Aura Media Engine (${catalogEntry.label}) active`
        : 'GEMINI_API_KEY required for media engine',
    };
  }

  // OpenAI models (GPT-4o mini, o3-mini, GPT-4o)
  if (
    catalogEntry.providerId === 'openai' ||
    requestedId.startsWith('gpt-') ||
    requestedId.startsWith('o3-')
  ) {
    const routeType: ExecutionRouteType = openaiDirect
      ? 'direct'
      : geminiConfigured
      ? 'aura-relay'
      : 'unconfigured';

    return {
      requestedModelId: requestedId,
      effectiveModelId: catalogEntry.id,
      providerId: 'openai',
      effectiveMode,
      routeType,
      catalogEntry,
      isConfigured: openaiDirect || geminiConfigured,
      statusNoteFr: openaiDirect
        ? `Connexion directe OpenAI (${catalogEntry.label})`
        : geminiConfigured
        ? `${catalogEntry.label} via Relais Intelligent Aura`
        : 'Aucune clé API configurée',
      statusNoteEn: openaiDirect
        ? `Direct OpenAI connection (${catalogEntry.label})`
        : geminiConfigured
        ? `${catalogEntry.label} via Aura Smart Relay`
        : 'No API key configured',
    };
  }

  // Anthropic models (Claude 3.5 Haiku, Claude 3.7 Sonnet)
  if (
    catalogEntry.providerId === 'anthropic' ||
    requestedId.startsWith('claude-')
  ) {
    const routeType: ExecutionRouteType = anthropicDirect
      ? 'direct'
      : geminiConfigured
      ? 'aura-relay'
      : 'unconfigured';

    return {
      requestedModelId: requestedId,
      effectiveModelId: catalogEntry.id,
      providerId: 'anthropic',
      effectiveMode,
      routeType,
      catalogEntry,
      isConfigured: anthropicDirect || geminiConfigured,
      statusNoteFr: anthropicDirect
        ? `Connexion directe Anthropic (${catalogEntry.label})`
        : geminiConfigured
        ? `${catalogEntry.label} via Relais Intelligent Aura`
        : 'Aucune clé API configurée',
      statusNoteEn: anthropicDirect
        ? `Direct Anthropic connection (${catalogEntry.label})`
        : geminiConfigured
        ? `${catalogEntry.label} via Aura Smart Relay`
        : 'No API key configured',
    };
  }

  // Native Aura models (aura-3.8-flash, aura-3.1-lite, aura-3.1-pro, aura-studio-architect, aura-deep-research)
  // and Google Gemini models
  return {
    requestedModelId: requestedId,
    effectiveModelId: catalogEntry.id,
    providerId: 'gemini',
    effectiveMode,
    routeType: geminiConfigured ? 'direct' : 'unconfigured',
    catalogEntry,
    isConfigured: geminiConfigured,
    statusNoteFr: geminiConfigured
      ? `Moteur natif ${catalogEntry.label} prêt`
      : 'Clé GEMINI_API_KEY absente',
    statusNoteEn: geminiConfigured
      ? `Native engine ${catalogEntry.label} ready`
      : 'GEMINI_API_KEY missing',
  };
}

/**
 * Returns the catalog models enriched with live provider availability and routing state.
 */
export function getEnrichedCatalogModels(
  providers: ProviderStatus[] = [],
  category?: ModelCategory
): EnrichedCatalogModel[] {
  const list = category
    ? AURA_MODEL_CATALOG.filter((m) => m.category === category)
    : AURA_MODEL_CATALOG;

  return list.map((model) => {
    const route = resolveModelRouting({
      modelId: model.id,
      providerId: model.providerId,
      mode: model.defaultMode || 'chat',
      providers,
    });

    return {
      ...model,
      routeType: route.routeType,
      isAvailable: route.isConfigured,
      statusNoteFr: route.statusNoteFr,
      statusNoteEn: route.statusNoteEn,
    };
  });
}

/**
 * Fetches live provider statuses from the backend (`/api/providers`).
 */
export async function fetchProviderStatuses(): Promise<ProviderStatus[]> {
  try {
    const res = await fetchWithRetry(
      '/api/providers',
      { headers: buildAuthHeaders() },
      10000,
      1
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.providers) ? data.providers : [];
  } catch {
    return [];
  }
}

/**
 * Dynamically routes and dispatches a user request to the appropriate AI model
 * (Aura native, Gemini, OpenAI, Anthropic, or Media Studio engines).
 */
export async function sendAIRequest(
  params: SendAIRequestParams,
  providers: ProviderStatus[] = []
): Promise<SendAIResponseResult> {
  const route = resolveModelRouting({
    modelId: params.modelId,
    providerId: params.providerId,
    mode: params.mode,
    providers,
  });

  const response = await fetchWithRetry(
    '/api/ai/chat',
    {
      method: 'POST',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        conversationId: params.conversationId,
        projectId: params.projectId,
        mode: route.effectiveMode,
        message: params.message,
        providerId: route.providerId,
        modelId: route.effectiveModelId,
        mediaOptions: params.mediaOptions,
        language: params.language || 'fr',
        attachments: params.attachments,
        activeArtifactContext: params.activeArtifactContext,
      }),
    },
    65000,
    1
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    let errMessage = data.error;
    if (!errMessage) {
      if (response.status === 404) {
        errMessage =
          'Route API introuvable (404 sur Vercel). Vérifiez que les fonctions Serverless Vercel sont activées.';
      } else if (response.status === 503) {
        errMessage =
          'Service IA non configuré (503). La variable GEMINI_API_KEY est manquante dans votre projet Vercel.';
      } else {
        errMessage = `Erreur de communication avec le serveur (${response.status}). Vérifiez vos variables Vercel.`;
      }
    }
    const error = new Error(errMessage) as Error & { usage?: UsageMetrics };
    if (data.usage) {
      error.usage = data.usage;
    }
    throw error;
  }

  return {
    conversation: data.conversation as Conversation,
    usage: data.usage as UsageMetrics | undefined,
    route,
  };
}

/**
 * Polls the status of an asynchronous Veo 3.1 video generation operation.
 */
export async function pollVideoOperationStatus(
  operationName: string
): Promise<VideoStatusResult> {
  const res = await fetchWithRetry(
    '/api/ai/video-status',
    {
      method: 'POST',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ operationName }),
    },
    20000,
    0
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    return {
      done: false,
      error: errData.error || 'Impossible de vérifier le statut de la vidéo.',
    };
  }

  return (await res.json()) as VideoStatusResult;
}

export const aiService = {
  resolveModelRouting,
  getEnrichedCatalogModels,
  fetchProviderStatuses,
  sendAIRequest,
  pollVideoOperationStatus,
};
