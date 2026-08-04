import { useCallback, useEffect, useRef, useState } from "react";
import { SpeechSynthesisService } from "./SpeechSynthesisService";
import type { VoiceSettings } from "./voice.types";

export interface UseSpeechSynthesisReturn {
  isSpeaking: boolean;
  isPaused: boolean;
  voices: SpeechSynthesisVoice[];
  isSupported: boolean;
  speak: (
    text: string,
    settings: VoiceSettings,
    onEnd?: () => void,
    onError?: (err: string) => void,
  ) => boolean;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported] = useState(() => SpeechSynthesisService.isSupported());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      return window.speechSynthesis.getVoices();
    }
    return [];
  });

  const serviceRef = useRef<SpeechSynthesisService | null>(null);

  useEffect(() => {
    if (isSupported) {
      const service = new SpeechSynthesisService();
      serviceRef.current = service;

      const loadVoices = () => {
        const availableVoices = service.getVoices();
        setVoices(availableVoices);
      };

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      serviceRef.current?.stop();
    };
  }, [isSupported]);

  const speak = useCallback(
    (
      text: string,
      settings: VoiceSettings,
      onEnd?: () => void,
      onError?: (err: string) => void,
    ): boolean => {
      if (!serviceRef.current) {
        onError?.("Speech synthesis is not supported in this browser.");
        return false;
      }

      setIsSpeaking(true);
      setIsPaused(false);

      return serviceRef.current.speak(text, settings, {
        onStart: () => {
          setIsSpeaking(true);
          setIsPaused(false);
        },
        onEnd: () => {
          setIsSpeaking(false);
          setIsPaused(false);
          onEnd?.();
        },
        onError: (errMessage: string) => {
          setIsSpeaking(false);
          setIsPaused(false);
          onError?.(errMessage);
        },
      });
    },
    [],
  );

  const stop = useCallback(() => {
    serviceRef.current?.stop();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    serviceRef.current?.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    serviceRef.current?.resume();
    setIsPaused(false);
  }, []);

  return {
    isSpeaking,
    isPaused,
    voices,
    isSupported,
    speak,
    stop,
    pause,
    resume,
  };
}
