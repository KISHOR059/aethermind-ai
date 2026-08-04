import type { SpeechRecognitionEventInit } from "./voice.types";

export type SpeechRecognitionCallback = {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (errorMessage: string) => void;
  onEnd?: () => void;
};

// Interface for browser SpeechRecognition API
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEventInit) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: Event & { error: string }) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

function getSpeechRecognitionClass(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;

  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export class SpeechRecognitionService {
  private recognition: ISpeechRecognition | null = null;
  private isListeningInternal = false;

  public static isSupported(): boolean {
    return getSpeechRecognitionClass() !== null;
  }

  public constructor() {
    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (SpeechRecognitionClass) {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    }
  }

  public get isListening(): boolean {
    return this.isListeningInternal;
  }

  public start(
    callbacks: SpeechRecognitionCallback,
    language = "en-US",
  ): boolean {
    if (!this.recognition) {
      callbacks.onError?.("Speech recognition is not supported in this browser.");
      return false;
    }

    if (this.isListeningInternal) {
      this.stop();
    }

    try {
      this.recognition.lang = language;

      this.recognition.onstart = () => {
        this.isListeningInternal = true;
        callbacks.onStart?.();
      };

      this.recognition.onresult = (event: SpeechRecognitionEventInit) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result || result.length === 0) continue;

          const transcript = result[0]?.transcript ?? "";
          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        const isFinal = Boolean(finalTranscript);

        if (currentTranscript.trim()) {
          callbacks.onResult?.(currentTranscript, isFinal);
        }
      };

      this.recognition.onerror = (event: Event & { error: string }) => {
        this.isListeningInternal = false;
        const userFriendlyMessage = mapSpeechError(event.error);
        callbacks.onError?.(userFriendlyMessage);
      };

      this.recognition.onend = () => {
        this.isListeningInternal = false;
        callbacks.onEnd?.();
      };

      this.recognition.start();
      return true;
    } catch (err) {
      this.isListeningInternal = false;
      callbacks.onError?.("Failed to start speech recognition: " + (err instanceof Error ? err.message : "Unknown error"));
      return false;
    }
  }

  public stop(): void {
    if (this.recognition && this.isListeningInternal) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore stop errors if already stopped
      }
      this.isListeningInternal = false;
    }
  }

  public cancel(): void {
    if (this.recognition && this.isListeningInternal) {
      try {
        this.recognition.abort();
      } catch {
        // Ignore abort errors
      }
      this.isListeningInternal = false;
    }
  }
}

function mapSpeechError(errorCode: string): string {
  switch (errorCode) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission was denied. Please check your browser settings.";
    case "no-speech":
      return "No speech detected. Please speak clearly into your microphone.";
    case "audio-capture":
      return "No microphone found. Please ensure your microphone is connected.";
    case "network":
      return "Network error during speech recognition. Please check your connection.";
    case "aborted":
      return "Speech recognition was cancelled.";
    default:
      return `Speech recognition error: ${errorCode}`;
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
