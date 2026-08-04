import { useState, useCallback, useEffect } from "react";
import type {
  OfflineVoiceState,
  OfflineVoiceSettings,
  VoicePerformanceMetrics,
} from "./voice.types";
import { DEFAULT_OFFLINE_VOICE_SETTINGS, OFFLINE_VOICE_SETTINGS_KEY } from "./voice.types";
import { useVoiceRecorder } from "./VoiceRecorder";
import { offlineVoiceService } from "./voice.service";
import { notify } from "@/shared/lib/notifications";

export interface UseOfflineVoiceAssistantReturn {
  voiceState: OfflineVoiceState;
  audioLevel: number;
  transcript: string;
  responseAudioBuffer: ArrayBuffer | null;
  metrics: VoicePerformanceMetrics | null;
  settings: OfflineVoiceSettings;
  updateSettings: (newSettings: Partial<OfflineVoiceSettings>) => void;
  startVoiceInput: () => Promise<void>;
  stopVoiceInputAndProcess: (
    onSendToAssistant: (text: string) => Promise<string>,
  ) => Promise<void>;
  cancelVoiceInput: () => void;
  stopAudioPlayback: () => void;
}

export function useOfflineVoiceAssistant(): UseOfflineVoiceAssistantReturn {
  const [voiceState, setVoiceState] = useState<OfflineVoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [responseAudioBuffer, setResponseAudioBuffer] = useState<ArrayBuffer | null>(null);
  const [metrics, setMetrics] = useState<VoicePerformanceMetrics | null>(null);

  const [settings, setSettings] = useState<OfflineVoiceSettings>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(OFFLINE_VOICE_SETTINGS_KEY);
        if (saved) return JSON.parse(saved) as OfflineVoiceSettings;
      }
    } catch {
      // Ignore
    }
    return DEFAULT_OFFLINE_VOICE_SETTINGS;
  });

  const {
    isRecording,
    audioLevel,
    error: recorderError,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder();

  useEffect(() => {
    if (recorderError) {
      notify.error("Microphone Error", recorderError);
    }
  }, [recorderError]);

  const updateSettings = useCallback((newSettings: Partial<OfflineVoiceSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(OFFLINE_VOICE_SETTINGS_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  const startVoiceInput = useCallback(async () => {
    setResponseAudioBuffer(null);
    setTranscript("");
    const success = await startRecording(settings);
    if (success) {
      setVoiceState("listening");
    }
  }, [startRecording, settings]);

  const cancelVoiceInput = useCallback(() => {
    cancelRecording();
    setVoiceState("idle");
    setTranscript("");
  }, [cancelRecording]);

  const stopAudioPlayback = useCallback(() => {
    setResponseAudioBuffer(null);
    setVoiceState("idle");
  }, []);

  const stopVoiceInputAndProcess = useCallback(
    async (onSendToAssistant: (text: string) => Promise<string>) => {
      if (!isRecording && voiceState !== "listening") return;

      const totalStart = performance.now();
      setVoiceState("uploading");

      const recResult = await stopRecording();
      if (!recResult || recResult.blob.size === 0) {
        setVoiceState("idle");
        return;
      }

      const recMs = Math.round(recResult.durationMs);

      try {
        // 1. Transcribe
        setVoiceState("transcribing");
        const sttRes = await offlineVoiceService.transcribeAudio(
          recResult.blob,
          settings.sttModel,
        );

        const recognizedText = sttRes.text.trim();
        setTranscript(recognizedText);

        if (!recognizedText) {
          notify.info("Voice Assistant", "No speech detected in recording.");
          setVoiceState("idle");
          return;
        }

        // 2. AI Inference via existing Assistant API pipeline
        setVoiceState("thinking");
        const aiStart = performance.now();
        const assistantReplyText = await onSendToAssistant(recognizedText);
        const aiInferenceMs = Math.round(performance.now() - aiStart);

        // 3. Speech Synthesis via Piper TTS / Local Engine
        if (settings.autoSpeak && assistantReplyText) {
          setVoiceState("generating_speech");
          const ttsStart = performance.now();

          const audioBuf = await offlineVoiceService.synthesizeSpeech(
            assistantReplyText,
            settings.ttsVoice,
            settings.speechRate,
            settings.pitch,
          );

          const ttsMs = Math.round(performance.now() - ttsStart);
          const totalMs = Math.round(performance.now() - totalStart);

          setMetrics({
            recordingTimeMs: recMs,
            transcriptionTimeMs: sttRes.metrics.transcriptionTimeMs,
            aiInferenceTimeMs: aiInferenceMs,
            speechGenerationTimeMs: ttsMs,
            totalResponseTimeMs: totalMs,
          });

          setResponseAudioBuffer(audioBuf);
          setVoiceState("speaking");
        } else {
          setVoiceState("ready");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Voice processing error";
        notify.error("Offline Voice Error", message);
        setVoiceState("idle");
      }
    },
    [isRecording, voiceState, stopRecording, settings],
  );

  return {
    voiceState,
    audioLevel,
    transcript,
    responseAudioBuffer,
    metrics,
    settings,
    updateSettings,
    startVoiceInput,
    stopVoiceInputAndProcess,
    cancelVoiceInput,
    stopAudioPlayback,
  };
}

export default useOfflineVoiceAssistant;
