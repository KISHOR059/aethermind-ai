import type {
  GenerateTextRequest,
  GenerateTextResponse,
  ModelInformation,
  ProviderStatus,
} from "./types.js";

export interface AIProvider {
  readonly modelInformation: ModelInformation;
  readonly status: ProviderStatus;

  generateText(
    request: GenerateTextRequest,
  ): Promise<GenerateTextResponse>;
}
