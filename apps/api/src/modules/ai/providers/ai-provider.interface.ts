import type {
  GenerateTextRequest,
  GenerateTextResponse,
  ModelInformation,
  ProviderStatus,
  StructuredGenerationRequest,
} from "./types.js";

export interface AIProvider {
  readonly modelInformation: ModelInformation;
  readonly status: ProviderStatus;

  generateText(
    request: GenerateTextRequest,
  ): Promise<GenerateTextResponse>;

  generateStructuredOutput<T>(
    request: StructuredGenerationRequest<T>,
  ): Promise<T>;
}
