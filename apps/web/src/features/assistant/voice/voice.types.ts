export type VoiceState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "disabled";

export interface VoiceSettings {
  language: string;
  rate: number;
  pitch: number;
  voiceURI: string;
  autoSpeak: boolean;
  autoListen: boolean;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  language: "en-US",
  rate: 1.0,
  pitch: 1.0,
  voiceURI: "",
  autoSpeak: false,
  autoListen: false,
};

export const VOICE_SETTINGS_STORAGE_KEY = "aethermind_voice_settings";

export type SpeechRecognitionErrorCode =
  | "no-speech"
  | "aborted"
  | "audio-capture"
  | "network"
  | "not-allowed"
  | "service-not-allowed"
  | "bad-grammar"
  | "language-not-supported"
  | "unknown";

export interface SpeechRecognitionResultItem {
  readonly transcript: string;
  readonly confidence: number;
}

export interface SpeechRecognitionResultList {
  readonly [index: number]: {
    readonly [index: number]: SpeechRecognitionResultItem;
    readonly isFinal: boolean;
    readonly length: number;
  };
  readonly length: number;
}

export interface SpeechRecognitionEventInit extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
