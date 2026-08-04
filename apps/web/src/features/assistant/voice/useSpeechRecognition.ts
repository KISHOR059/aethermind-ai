import { useCallback, useEffect, useRef, useState } from "react";
import { SpeechRecognitionService } from "./SpeechRecognitionService";

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  start: (language?: string, onFinalText?: (text: string) => void) => boolean;
  stop: () => void;
  cancel: () => void;
  clearTranscript: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => SpeechRecognitionService.isSupported());

  const serviceRef = useRef<SpeechRecognitionService | null>(null);
  const onFinalCallbackRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    if (isSupported) {
      serviceRef.current = new SpeechRecognitionService();
    }

    return () => {
      serviceRef.current?.cancel();
    };
  }, [isSupported]);

  const start = useCallback(
    (language = "en-US", onFinalText?: (text: string) => void): boolean => {
      if (!serviceRef.current) {
        setError("Speech recognition is not supported in this browser.");
        return false;
      }

      setError(null);
      setTranscript("");
      onFinalCallbackRef.current = onFinalText ?? null;

      return serviceRef.current.start(
        {
          onStart: () => {
            setIsListening(true);
          },
          onResult: (text: string, isFinal: boolean) => {
            setTranscript(text);
            if (isFinal) {
              onFinalCallbackRef.current?.(text);
            }
          },
          onError: (errMessage: string) => {
            setIsListening(false);
            setError(errMessage);
          },
          onEnd: () => {
            setIsListening(false);
          },
        },
        language,
      );
    },
    [],
  );

  const stop = useCallback(() => {
    serviceRef.current?.stop();
    setIsListening(false);
  }, []);

  const cancel = useCallback(() => {
    serviceRef.current?.cancel();
    setIsListening(false);
    setTranscript("");
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    start,
    stop,
    cancel,
    clearTranscript,
  };
}
