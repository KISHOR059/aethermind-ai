export type FinishReason =
  | "STOP"
  | "MAX_TOKENS"
  | "SAFETY"
  | "RECITATION"
  | "OTHER"
  | "UNKNOWN";

export type UsageMetadata = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type ModelInformation = {
  provider: string;
  model: string;
  version: string;
};

export type ThinkingLevel = "none" | "low" | "medium" | "high";

export type GenerateTextRequest = {
  input: string;
  model?: string;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  numCtx?: number;
  responseMimeType?: string;
  responseSchema?: unknown;
  thinkingLevel?: ThinkingLevel;
  thinkingBudget?: number;
};

export type GenerateTextResponse = {
  text: string;
  finishReason: FinishReason;
  usage?: UsageMetadata;
  model: ModelInformation;
  fallbackUsed?: boolean;
  primaryProvider?: string;
  fallbackReason?: string;
  retryCount?: number;
  latencyMs?: number;
};

export type ProviderStatus =
  | "configured"
  | "healthy"
  | "offline"
  | "not_configured";

export type ProviderHealth = {
  provider: string;
  model: string;
  status: ProviderStatus;
  version: string;
  isAvailable: boolean;
  latencyMs?: number;
  fallback?: {
    provider: string;
    model: string;
    status: ProviderStatus;
    isAvailable: boolean;
  };
};
