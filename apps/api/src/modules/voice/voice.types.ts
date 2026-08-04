export type WhisperModelSize = "tiny" | "base" | "small" | "medium" | "large";

export type VoiceGender = "male" | "female" | "neutral";

export interface TranscribeOptions {
  model?: WhisperModelSize | string;
  language?: string;
}

export interface TranscribeResult {
  text: string;
  language?: string;
  confidence?: number;
}

export interface SynthesizeOptions {
  voice?: string;
  gender?: VoiceGender;
  rate?: number;
  pitch?: number;
}

export interface VoiceMetrics {
  recordingTimeMs?: number;
  transcriptionTimeMs: number;
  aiInferenceTimeMs?: number;
  speechGenerationTimeMs: number;
  totalResponseTimeMs: number;
  providerStt: string;
  providerTts: string;
}

export interface SpeechRecognitionProvider {
  readonly name: string;
  transcribe(
    audioBuffer: Buffer,
    options?: TranscribeOptions,
  ): Promise<TranscribeResult>;
  isAvailable(): Promise<boolean>;
}

export interface SpeechSynthesisProvider {
  readonly name: string;
  synthesize(
    text: string,
    options?: SynthesizeOptions,
  ): Promise<Buffer>;
  isAvailable(): Promise<boolean>;
}

export interface TranscribeResponse {
  text: string;
  metrics: {
    transcriptionTimeMs: number;
    provider: string;
  };
}

export interface SpeakRequest {
  text: string;
  voice?: string;
  rate?: number;
  pitch?: number;
}
