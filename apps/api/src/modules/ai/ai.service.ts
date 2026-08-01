import type { AIProvider } from "./providers/ai-provider.interface.js";
import type { ProviderStatus } from "./providers/types.js";

export type AiHealth = {
  provider: string;
  model: string;
  status: ProviderStatus;
  version: string;
};

export class AiService {
  public constructor(private readonly aiProvider: AIProvider) {}

  public getHealth(): AiHealth {
    return {
      provider: this.aiProvider.modelInformation.provider,
      model: this.aiProvider.modelInformation.model,
      status: this.aiProvider.status,
      version: this.aiProvider.modelInformation.version,
    };
  }
}
