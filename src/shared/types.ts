import { z } from 'zod';

export type AuraMode = 'chat' | 'search' | 'code' | 'create';
export type AuraLanguage = 'fr' | 'en';
export type AuraTheme = 'light' | 'dark';

export const AuraModeSchema = z.enum(['chat', 'search', 'code', 'create']);

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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  organization?: string;
  location?: string;
  avatarUrl?: string;
  plan: 'free' | 'pro';
  authProvider?: 'email' | 'google' | 'github';
  onboardingCompleted: boolean;
  onboarding?: OnboardingData;
  preferences: {
    language: AuraLanguage;
    theme: AuraTheme;
    defaultMode: AuraMode;
    defaultProvider: string;
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
}

export const SendMessagePayloadSchema = z.object({
  conversationId: z.string().optional(),
  projectId: z.string().optional(),
  mode: AuraModeSchema,
  message: z.string().min(1, 'Le message ne peut pas être vide').max(16000),
  providerId: z.string().optional(),
  modelId: z.string().optional(),
  language: z.enum(['fr', 'en']).optional(),
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
