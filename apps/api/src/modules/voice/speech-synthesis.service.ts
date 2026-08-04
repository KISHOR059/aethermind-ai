import type {
  SpeechSynthesisProvider,
  SynthesizeOptions,
} from "./voice.types.js";
import { PiperTtsProvider } from "./providers/speech-synthesis.provider.js";

export class SpeechSynthesisService {
  private provider: SpeechSynthesisProvider;

  public constructor(provider?: SpeechSynthesisProvider) {
    this.provider = provider ?? new PiperTtsProvider();
  }

  public setProvider(provider: SpeechSynthesisProvider): void {
    this.provider = provider;
  }

  public get providerName(): string {
    return this.provider.name;
  }

  public async synthesize(
    text: string,
    options?: SynthesizeOptions,
  ): Promise<Buffer> {
    return this.provider.synthesize(text, options);
  }

  public async isAvailable(): Promise<boolean> {
    return this.provider.isAvailable();
  }
}

export const speechSynthesisService = new SpeechSynthesisService();
