import { z } from 'zod';

export type AuraMode =
  | 'chat'
  | 'search'
  | 'code'
  | 'create'
  | 'image'
  | 'video'
  | 'slides';
export type AuraLanguage = 'fr' | 'en';
export type AuraTheme = 'light' | 'dark';

export const AuraModeSchema = z.enum([
  'chat',
  'search',
  'code',
  'create',
  'image',
  'video',
  'slides',
]);

export type ModelCategory = 'aura' | 'free_llm' | 'image' | 'video_slides';

export interface CatalogModelDefinition {
  id: string;
  providerId: 'gemini' | 'openai' | 'anthropic' | 'openrouter';
  category: ModelCategory;
  label: string;
  badgeFr: string;
  badgeEn: string;
  subtitleFr: string;
  subtitleEn: string;
  icon: string;
  accentColor: string;
  isFreeTier: boolean;
  defaultMode?: AuraMode;
  capabilities: AuraMode[];
}

export const AURA_MODEL_CATALOG: CatalogModelDefinition[] = [
  // --- 1. GAMME AURA (5 Modèles Natifs Spécialisés) ---
  {
    id: 'aura-3.8-flash',
    providerId: 'gemini',
    category: 'aura',
    label: 'Aura 3.8 Flash',
    badgeFr: 'Par défaut · Gratuit',
    badgeEn: 'Default · Free',
    subtitleFr: 'Raisonnement rapide, polyvalence & Recherche Google',
    subtitleEn: 'Fast reasoning, versatility & Google Grounding',
    icon: 'fa-solid fa-bolt',
    accentColor: '#078348',
    isFreeTier: true,
    capabilities: ['chat', 'search', 'code', 'create', 'slides'],
  },
  {
    id: 'aura-3.1-lite',
    providerId: 'gemini',
    category: 'aura',
    label: 'Aura 3.1 Lite',
    badgeFr: 'Ultra-rapide · Gratuit',
    badgeEn: 'Ultra-fast · Free',
    subtitleFr: 'Latence minimale pour synthèses et dialogues instantanés',
    subtitleEn: 'Minimal latency for instant summaries & Q&A',
    icon: 'fa-solid fa-feather-pointed',
    accentColor: '#39B969',
    isFreeTier: true,
    capabilities: ['chat', 'code', 'create'],
  },
  {
    id: 'aura-3.1-pro',
    providerId: 'gemini',
    category: 'aura',
    label: 'Aura 3.1 Pro',
    badgeFr: 'Raisonnement Profond',
    badgeEn: 'Deep Reasoning',
    subtitleFr: 'Architecture complexe, mathématiques, STEM & longs projets',
    subtitleEn: 'Complex architecture, math, STEM & deep projects',
    icon: 'fa-solid fa-brain',
    accentColor: '#078348',
    isFreeTier: true,
    capabilities: ['chat', 'search', 'code', 'create', 'slides'],
  },
  {
    id: 'aura-studio-architect',
    providerId: 'gemini',
    category: 'aura',
    label: 'Aura Studio Architect',
    badgeFr: 'Spécialiste Web & UI',
    badgeEn: 'Web & UI Specialist',
    subtitleFr: 'Création d’applications HTML/CSS/JS et design systèmes',
    subtitleEn: 'Interactive HTML/CSS/JS apps & design systems',
    icon: 'fa-solid fa-compass-drafting',
    accentColor: '#FF790D',
    isFreeTier: true,
    defaultMode: 'code',
    capabilities: ['code', 'create', 'slides', 'chat'],
  },
  {
    id: 'aura-deep-research',
    providerId: 'gemini',
    category: 'aura',
    label: 'Aura Deep Research',
    badgeFr: 'Investigation Web',
    badgeEn: 'Web Investigation',
    subtitleFr: 'Recherche vérifiée multi-sources et synthèse sourcée',
    subtitleEn: 'Multi-source verified web research & reports',
    icon: 'fa-solid fa-magnifying-glass-chart',
    accentColor: '#EACB37',
    isFreeTier: true,
    defaultMode: 'search',
    capabilities: ['search', 'chat', 'create'],
  },

  // --- 2. MODÈLES GRATUITS GEMINI, GPT & CLAUDE ---
  {
    id: 'gemini-3.8-flash',
    providerId: 'gemini',
    category: 'free_llm',
    label: 'Gemini 3.8 Flash',
    badgeFr: 'Google · Gratuit',
    badgeEn: 'Google · Free',
    subtitleFr: 'Modèle multimodal rapide de Google avec Grounding',
    subtitleEn: 'Fast multimodal Google model with Grounding',
    icon: 'fa-solid fa-wand-magic-sparkles',
    accentColor: '#078348',
    isFreeTier: true,
    capabilities: ['chat', 'search', 'code', 'create', 'slides'],
  },
  {
    id: 'gemini-3.1-flash-lite',
    providerId: 'gemini',
    category: 'free_llm',
    label: 'Gemini 3.1 Flash Lite',
    badgeFr: 'Google · Gratuit',
    badgeEn: 'Google · Free',
    subtitleFr: 'Modèle léger haute efficacité et très faible latence',
    subtitleEn: 'High-efficiency lightweight model',
    icon: 'fa-solid fa-gauge-Simple-high',
    accentColor: '#39B969',
    isFreeTier: true,
    capabilities: ['chat', 'code', 'create'],
  },
  {
    id: 'gpt-4o-mini',
    providerId: 'openai',
    category: 'free_llm',
    label: 'GPT-4o mini',
    badgeFr: 'OpenAI · Free Tier',
    badgeEn: 'OpenAI · Free Tier',
    subtitleFr: 'Modèle rapide et polyvalent d’OpenAI (ou relais Aura)',
    subtitleEn: 'Fast versatile OpenAI model (or Aura relay)',
    icon: 'fa-solid fa-microchip',
    accentColor: '#10A37F',
    isFreeTier: true,
    capabilities: ['chat', 'code', 'create', 'slides'],
  },
  {
    id: 'o3-mini',
    providerId: 'openai',
    category: 'free_llm',
    label: 'OpenAI o3-mini',
    badgeFr: 'OpenAI · Free Tier',
    badgeEn: 'OpenAI · Free Tier',
    subtitleFr: 'Raisonnement algorithmique, logique et programmation',
    subtitleEn: 'Algorithmic reasoning, logic & coding',
    icon: 'fa-solid fa-diagram-project',
    accentColor: '#10A37F',
    isFreeTier: true,
    capabilities: ['chat', 'code'],
  },
  {
    id: 'gpt-4o',
    providerId: 'openai',
    category: 'free_llm',
    label: 'GPT-4o Omni',
    badgeFr: 'OpenAI · Flagship',
    badgeEn: 'OpenAI · Flagship',
    subtitleFr: 'Raisonnement avancé et rédaction multidimensionnelle',
    subtitleEn: 'Advanced reasoning & multidimensional writing',
    icon: 'fa-solid fa-cubes',
    accentColor: '#10A37F',
    isFreeTier: true,
    capabilities: ['chat', 'code', 'create', 'slides'],
  },
  {
    id: 'claude-3-5-haiku',
    providerId: 'anthropic',
    category: 'free_llm',
    label: 'Claude 3.5 Haiku',
    badgeFr: 'Anthropic · Free Tier',
    badgeEn: 'Anthropic · Free Tier',
    subtitleFr: 'Modèle rapide d’Anthropic pour code et rédaction',
    subtitleEn: 'Fast Anthropic model for coding & writing',
    icon: 'fa-solid fa-feather',
    accentColor: '#D97757',
    isFreeTier: true,
    capabilities: ['chat', 'code', 'create'],
  },
  {
    id: 'claude-3-7-sonnet',
    providerId: 'anthropic',
    category: 'free_llm',
    label: 'Claude 3.7 Sonnet',
    badgeFr: 'Anthropic · Code & Créa',
    badgeEn: 'Anthropic · Code & Create',
    subtitleFr: 'Architecture logicielle, design et nuance éditoriale',
    subtitleEn: 'Software architecture, design & editorial nuance',
    icon: 'fa-solid fa-code-branch',
    accentColor: '#D97757',
    isFreeTier: true,
    capabilities: ['chat', 'code', 'create', 'slides'],
  },

  // --- 3. MODÈLES DE GÉNÉRATION D'IMAGES ---
  {
    id: 'gemini-3.1-flash-lite-image',
    providerId: 'gemini',
    category: 'image',
    label: 'Aura Image Flash 3.1',
    badgeFr: 'Image IA · Rapide',
    badgeEn: 'AI Image · Fast',
    subtitleFr: 'Génération d’images, illustrations et visuels de marque',
    subtitleEn: 'Generate brand visuals, illustrations & photos',
    icon: 'fa-regular fa-image',
    accentColor: '#FF790D',
    isFreeTier: true,
    defaultMode: 'image',
    capabilities: ['image', 'create'],
  },
  {
    id: 'gemini-nano-banana-2.1',
    providerId: 'gemini',
    category: 'image',
    label: 'Nano Banana 2.1 HD',
    badgeFr: 'Image Studio 2K',
    badgeEn: 'Studio Image 2K',
    subtitleFr: 'Visuels haute définition, direction artistique & ratios variés',
    subtitleEn: 'High-definition visuals, art direction & multi-ratios',
    icon: 'fa-solid fa-wand-sparkles',
    accentColor: '#FF790D',
    isFreeTier: true,
    defaultMode: 'image',
    capabilities: ['image', 'create'],
  },
  {
    id: 'aura-vector-studio',
    providerId: 'gemini',
    category: 'image',
    label: 'Aura Vector SVG Studio',
    badgeFr: '100% Gratuit · Vectoriel',
    badgeEn: '100% Free · Vector SVG',
    subtitleFr: 'Illustrations vectorielles SVG haute précision & logos',
    subtitleEn: 'High-precision scalable SVG illustrations & posters',
    icon: 'fa-solid fa-bezier-curve',
    accentColor: '#078348',
    isFreeTier: true,
    defaultMode: 'image',
    capabilities: ['image', 'create'],
  },

  // --- 4. MODÈLES VIDÉOS & SLIDES (PRÉSENTATIONS) ---
  {
    id: 'aura-slides-pro',
    providerId: 'gemini',
    category: 'video_slides',
    label: 'Aura Slides Studio',
    badgeFr: 'Slides 16:9 · Gratuit',
    badgeEn: '16:9 Slides · Free',
    subtitleFr: 'Génère des présentations interactives multi-diapositives',
    subtitleEn: 'Generates interactive multi-slide presentations',
    icon: 'fa-solid fa-person-chalkboard',
    accentColor: '#078348',
    isFreeTier: true,
    defaultMode: 'slides',
    capabilities: ['slides', 'create'],
  },
  {
    id: 'veo-3.1-lite-generate-preview',
    providerId: 'gemini',
    category: 'video_slides',
    label: 'Aura Veo 3.1 Video',
    badgeFr: 'Vidéo IA & Motion',
    badgeEn: 'AI Video & Motion',
    subtitleFr: 'Génération vidéo cinématique Veo 3.1 et scène animée',
    subtitleEn: 'Veo 3.1 cinematic video & animated motion scene',
    icon: 'fa-solid fa-film',
    accentColor: '#FF790D',
    isFreeTier: true,
    defaultMode: 'video',
    capabilities: ['video', 'create'],
  },
  {
    id: 'aura-motion-canvas',
    providerId: 'gemini',
    category: 'video_slides',
    label: 'Aura Motion Canvas',
    badgeFr: 'Vidéo Web · Gratuit',
    badgeEn: 'Web Video · Free',
    subtitleFr: 'Animations vidéo HTML5/Canvas temps réel autonomes',
    subtitleEn: 'Self-contained real-time HTML5/Canvas motion video',
    icon: 'fa-solid fa-circle-play',
    accentColor: '#EACB37',
    isFreeTier: true,
    defaultMode: 'video',
    capabilities: ['video', 'code'],
  },
];

export interface GroundingSource {
  title: string;
  uri: string;
  domain: string;
  snippet?: string;
  verified: boolean;
}

export interface AttachmentItem {
  id: string;
  name: string;
  type: 'image' | 'document' | 'code';
  mimeType: string;
  size: number;
  dataUrl?: string;
  contentPreview?: string;
}

export interface VirtualStudioFile {
  path: string;
  language: string;
  content: string;
}

export interface CodeArtifact {
  language: string;
  filename: string;
  code: string;
  previewableHtml?: string;
  files?: VirtualStudioFile[];
}

export interface CreativeArtifact {
  title: string;
  category: string;
  summary: string;
  promptSuggestion: string;
  keyElements: string[];
  palette?: string[];
}

export interface ImageArtifact {
  title: string;
  prompt: string;
  imageUrl: string;
  mimeType: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  modelId: string;
  svgCode?: string;
  palette?: string[];
}

export interface VideoScene {
  sceneNumber: number;
  title: string;
  durationSeconds: number;
  visualDescription: string;
  narration: string;
}

export interface VideoArtifact {
  title: string;
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  modelId: string;
  videoUrl?: string;
  operationName?: string;
  status: 'ready' | 'polling' | 'interactive_motion';
  motionHtml?: string;
  scenes: VideoScene[];
}

export interface SlideItem {
  slideNumber: number;
  title: string;
  subtitle?: string;
  kicker?: string;
  bullets: string[];
  highlightMetric?: {
    value: string;
    label: string;
  };
  speakerNotes?: string;
  layout: 'hero' | 'split' | 'metrics' | 'roadmap' | 'closing';
  accentColor?: string;
}

export interface SlideArtifact {
  title: string;
  subtitle: string;
  theme: 'ivory-emerald' | 'dark-slate' | 'warm-editorial';
  slides: SlideItem[];
  exportableHtml: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  mode: AuraMode;
  createdAt: string;
  modelId?: string;
  providerId?: string;
  estimatedTokens?: number;
  sources?: GroundingSource[];
  attachments?: AttachmentItem[];
  codeArtifact?: CodeArtifact;
  creativeArtifact?: CreativeArtifact;
  imageArtifact?: ImageArtifact;
  videoArtifact?: VideoArtifact;
  slideArtifact?: SlideArtifact;
  savedToLibrary?: boolean;
  isUncertainNote?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  mode: AuraMode;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  pinned?: boolean;
}

export interface AuraProject {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: 'web' | 'study' | 'content' | 'business' | 'general';
  color: string;
  icon: string;
  systemContext?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuraMission {
  id: string;
  userId: string;
  title: string;
  category: string;
  status: 'in_progress' | 'completed' | 'ready';
  statusLabel: string;
  progress: number;
  description: string;
  mode: AuraMode;
  steps: { label: string; done: boolean }[];
  prompt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryItem {
  id: string;
  userId: string;
  type: 'conversation' | 'saved_response' | 'file';
  title: string;
  excerpt: string;
  mode: AuraMode;
  conversationId?: string;
  messageId?: string;
  fileMeta?: {
    mimeType: string;
    size: number;
    dataUrl?: string;
  };
  tags: string[];
  createdAt: string;
}

export interface OnboardingData {
  completed: boolean;
  goals: string[];
  experienceLevel: string;
  language: string;
  country: string;
  completedAt?: string;
}

export * from './plans.ts';
import type {
  PlanId,
  UsageCategory,
  UsageLedgerEntry,
} from './plans.ts';

export interface UserConsentRecord {
  termsVersion: string;
  privacyVersion: string;
  consentedAt: string;
  marketingConsent?: boolean;
}

export interface UserNotificationPreferences {
  securityAlerts: boolean;
  productUpdates: boolean;
  weeklyDigest: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  organization?: string;
  location?: string;
  avatarUrl?: string;
  plan: PlanId;
  authProvider?: 'email' | 'google' | 'github';
  onboardingCompleted: boolean;
  onboarding?: OnboardingData;
  createdAt?: string;
  consents?: UserConsentRecord;
  preferences: {
    language: AuraLanguage;
    theme: AuraTheme;
    defaultMode: AuraMode;
    defaultProvider: string;
    reducedMotion?: boolean;
    customInstructions?: string;
    notifications?: UserNotificationPreferences;
  };
}

export interface ProviderStatus {
  id: string;
  name: string;
  configured: boolean;
  envVarName: string;
  models: {
    id: string;
    label: string;
    capabilities: AuraMode[];
    isDefault?: boolean;
  }[];
  supportsStreaming: boolean;
  supportsWebSearch: boolean;
  supportsImageGeneration: boolean;
  statusMessage: string;
}

export interface UsageMetrics {
  date: string;
  requestsUsed: number;
  dailyLimit: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  byMode: Record<AuraMode, number>;
  byModel: Record<string, number>;
  recentLogs: {
    id: string;
    timestamp: string;
    mode: AuraMode;
    modelId: string;
    providerId: string;
    tokens: number;
    status: 'success' | 'error' | 'quota_exceeded';
  }[];
  // Enhanced Monthly Quota & Freemium Architecture fields
  planId: PlanId;
  monthlyUnitsUsed: number;
  monthlyUnitsLimit: number;
  webSearchesUsed: number;
  webSearchesLimit: number;
  siteCreationsUsed: number;
  siteCreationsLimit: number;
  siteModificationsUsed: number;
  siteModificationsLimit: number;
  activeProjectsCount: number;
  maxProjectsLimit: number;
  periodRenewalDate: string;
  byCategory: Record<UsageCategory, number>;
  recentLedger: UsageLedgerEntry[];
}

export const SendMessagePayloadSchema = z.object({
  conversationId: z.string().optional(),
  projectId: z.string().optional(),
  mode: AuraModeSchema,
  message: z.string().min(1, 'Le message ne peut pas être vide').max(16000),
  providerId: z.string().optional(),
  modelId: z.string().optional(),
  language: z.enum(['fr', 'en']).optional(),
  mediaOptions: z
    .object({
      aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).optional(),
      slideCount: z.number().min(3).max(15).optional(),
      style: z.string().optional(),
    })
    .optional(),
  attachments: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(['image', 'document', 'code']),
        mimeType: z.string(),
        size: z.number(),
        dataUrl: z.string().optional(),
        contentPreview: z.string().optional(),
      })
    )
    .optional(),
  activeArtifactContext: z
    .object({
      title: z.string().optional(),
      mode: AuraModeSchema.optional(),
      filename: z.string().optional(),
      code: z.string().optional(),
      content: z.string().optional(),
    })
    .optional(),
});

export type SendMessagePayload = z.infer<typeof SendMessagePayloadSchema>;
