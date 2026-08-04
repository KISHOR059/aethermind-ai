import { useCallback, useRef, useState } from "react";
import type { OfflineVoiceSettings } from "./voice.types";

export interface VoiceRecorderResult {
  blob: Blob;
  durationMs: number;
}

export interface UseVoiceRecorderReturn {
  isRecording: boolean;
  audioLevel: number;
  error: string | null;
  startRecording: (settings?: Partial<OfflineVoiceSettings>) => Promise<boolean>;
  stopRecording: () => Promise<VoiceRecorderResult | null>;
  cancelRecording: () => void;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setAudioLevel(0);
  }, []);

  const startRecording = useCallback(
    async (settings?: Partial<OfflineVoiceSettings>): Promise<boolean> => {
      cleanup();
      setError(null);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Microphone access is not supported in this browser.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            noiseSuppression: settings?.noiseSuppression ?? true,
            echoCancellation: settings?.echoCancellation ?? true,
          },
        });

        streamRef.current = stream;

        // Audio analyzer setup
        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateAudioLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((acc, val) => acc + val, 0);
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(1, avg / 128));
          animFrameRef.current = requestAnimationFrame(updateAudioLevel);
        };
        updateAudioLevel();

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "audio/ogg";

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];
        startTimeRef.current = Date.now();

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.start(100);
        setIsRecording(true);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to access microphone";
        setError(message);
        cleanup();
        setIsRecording(false);
        return false;
      }
    },
    [cleanup],
  );

  const stopRecording = useCallback((): Promise<VoiceRecorderResult | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        cleanup();
        setIsRecording(false);
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const durationMs = Date.now() - startTimeRef.current;
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        cleanup();
        setIsRecording(false);
        resolve({ blob, durationMs });
      };

      recorder.stop();
    });
  }, [cleanup]);

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = () => {};
      recorder.stop();
    }
    cleanup();
    setIsRecording(false);
  }, [cleanup]);

  return {
    isRecording,
    audioLevel,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}

export default useVoiceRecorder;
