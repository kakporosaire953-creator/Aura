import {
  AttachmentItem,
  AuraLanguage,
  AuraMode,
  CodeArtifact,
  CreativeArtifact,
  GroundingSource,
  ProviderStatus,
} from '../../shared/types.ts';

export interface AIHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  mode: AuraMode;
  prompt: string;
  history: AIHistoryMessage[];
  modelId?: string;
  language: AuraLanguage;
  systemContext?: string;
  attachments?: AttachmentItem[];
  activeArtifactContext?: {
    title?: string;
    mode?: AuraMode;
    filename?: string;
    code?: string;
    content?: string;
  };
}

export interface AIResponse {
  text: string;
  modelId: string;
  providerId: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  sources?: GroundingSource[];
  codeArtifact?: CodeArtifact;
  creativeArtifact?: CreativeArtifact;
  isUncertainNote?: string;
}

export interface AIStreamChunk {
  textDelta: string;
  done: boolean;
}

export interface AIProviderAdapter {
  readonly id: string;
  readonly name: string;
  readonly envVarName: string;
  isConfigured(): boolean;
  getStatus(): ProviderStatus;
  estimateTokens(text: string): number;
  generateCompletion(request: AIRequest, signal?: AbortSignal): Promise<AIResponse>;
}
