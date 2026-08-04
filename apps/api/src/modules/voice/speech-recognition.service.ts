import type {
  SpeechRecognitionProvider,
  TranscribeOptions,
  TranscribeResult,
} from "./voice.types.js";
import { WhisperCppProvider } from "./providers/speech-recognition.provider.js";

export class SpeechRecognitionService {
  private provider: SpeechRecognitionProvider;

  public constructor(provider?: SpeechRecognitionProvider) {
    this.provider = provider ?? new WhisperCppProvider();
  }

  public setProvider(provider: SpeechRecognitionProvider): void {
    this.provider = provider;
  }

  public get providerName(): string {
    return this.provider.name;
  }

  public async transcribe(
    audioBuffer: Buffer,
    options?: TranscribeOptions,
  ): Promise<TranscribeResult> {
    return this.provider.transcribe(audioBuffer, options);
  }

  public async isAvailable(): Promise<boolean> {
    return this.provider.isAvailable();
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
