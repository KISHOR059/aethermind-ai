import type { VoiceSettings } from "./voice.types";

export type SpeechSynthesisCallbacks = {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
};

export class SpeechSynthesisService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  public static isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  public constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public speak(
    text: string,
    settings: VoiceSettings,
    callbacks?: SpeechSynthesisCallbacks,
  ): boolean {
    if (!this.synth) {
      callbacks?.onError?.("Speech synthesis is not supported in this browser.");
      return false;
    }

    // Stop any ongoing speech
    this.stop();

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) {
      callbacks?.onEnd?.();
      return false;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.rate = Math.max(0.5, Math.min(2.0, settings.rate));
      utterance.pitch = Math.max(0.5, Math.min(1.5, settings.pitch));
      utterance.lang = settings.language || "en-US";

      // Select specific voice if configured
      if (settings.voiceURI) {
        const voices = this.getVoices();
        const selectedVoice = voices.find((v) => v.voiceURI === settings.voiceURI);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.onstart = () => {
        callbacks?.onStart?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        callbacks?.onEnd?.();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        // Ignore canceled/interrupted speech errors
        if (event.error !== "canceled" && event.error !== "interrupted") {
          callbacks?.onError?.(`Speech synthesis error: ${event.error}`);
        } else {
          callbacks?.onEnd?.();
        }
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
      return true;
    } catch (err) {
      callbacks?.onError?.("Failed to initiate text-to-speech: " + (err instanceof Error ? err.message : "Unknown error"));
      return false;
    }
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public pause(): void {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  public resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public isSpeaking(): boolean {
    return Boolean(this.synth?.speaking);
  }

  public getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }
}

/**
 * Remove markdown syntax, code blocks, bullet formatting, and JSON noise
 * so speech synthesis sounds natural and fluent.
 */
function cleanTextForSpeech(text: string): string {
  if (!text) return "";

  return (
    text
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, "")
      // Remove inline code
      .replace(/`([^`]+)`/g, "$1")
      // Remove markdown links [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove headers # ## ###
      .replace(/^#{1,6}\s+/gm, "")
      // Remove bold/italic asterisks & underscores
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
      // Remove bullet list dashes/asterisks at line start
      .replace(/^[\s-*+.]+/gm, "")
      // Clean extra whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

export const speechSynthesisService = new SpeechSynthesisService();
