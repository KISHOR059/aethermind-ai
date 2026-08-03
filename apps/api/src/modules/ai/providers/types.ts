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

export type GenerateTextRequest = {
  input: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
};

export type GenerateTextResponse = {
  text: string;
  finishReason: FinishReason;
  usage?: UsageMetadata;
  model: ModelInformation;
};

export type StructuredGenerationRequest<T> = {
  input: string;
  schema: T;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
};

export type ProviderStatus =
  | "configured"
  | "healthy"
  | "offline"
  | "not_configured";
