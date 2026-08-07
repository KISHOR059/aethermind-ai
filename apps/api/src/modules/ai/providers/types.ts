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
  topP?: number;
  maxOutputTokens?: number;
  numCtx?: number;
};

export type GenerateTextResponse = {
  text: string;
  finishReason: FinishReason;
  usage?: UsageMetadata;
  model: ModelInformation;
};

export type ProviderStatus =
  | "configured"
  | "healthy"
  | "offline"
  | "not_configured";
