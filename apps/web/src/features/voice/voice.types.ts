export type OfflineVoiceState =
  | "idle"
  | "listening"
  | "uploading"
  | "transcribing"
  | "thinking"
  | "generating_speech"
  | "speaking"
  | "ready";

export type VoiceEngine = "local_ai" | "browser_api";

export type WhisperModel = "tiny" | "base" | "small" | "medium";

export type VoiceGender = "male" | "female";

export interface OfflineVoiceSettings {
  engine: VoiceEngine;
  sttModel: WhisperModel;
  ttsVoice: string;
  gender: VoiceGender;
  speechRate: number;
  pitch: number;
  autoSpeak: boolean;
  autoListen: boolean;
  noiseSuppression: boolean;
  echoCancellation: boolean;
}

export interface VoicePerformanceMetrics {
  recordingTimeMs?: number;
  transcriptionTimeMs?: number;
  aiInferenceTimeMs?: number;
  speechGenerationTimeMs?: number;
  totalResponseTimeMs?: number;
}

export const DEFAULT_OFFLINE_VOICE_SETTINGS: OfflineVoiceSettings = {
  engine: "local_ai",
  sttModel: "base",
  ttsVoice: "en_US-lessac-medium",
  gender: "female",
  speechRate: 1.0,
  pitch: 1.0,
  autoSpeak: true,
  autoListen: false,
  noiseSuppression: true,
  echoCancellation: true,
};

export const OFFLINE_VOICE_SETTINGS_KEY = "aethermind_offline_voice_settings";
