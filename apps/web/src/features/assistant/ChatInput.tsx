import type { ChangeEvent, KeyboardEvent } from "react";
import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Sliders } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { VoiceButton } from "./voice/VoiceButton";
import { VoiceSettingsDialog } from "./voice/VoiceSettingsDialog";
import { useSpeechRecognition } from "./voice/useSpeechRecognition";
import { useSpeechSynthesis } from "./voice/useSpeechSynthesis";
import {
  DEFAULT_VOICE_SETTINGS,
  VOICE_SETTINGS_STORAGE_KEY,
  type VoiceSettings,
  type VoiceState,
} from "./voice/voice.types";
import { notify } from "@/shared/lib/notifications";

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  lastAssistantMessage?: string;
}

export function ChatInput({
  onSendMessage,
  disabled,
  lastAssistantMessage,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(VOICE_SETTINGS_STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved) as VoiceSettings;
        }
      }
    } catch {
      // Ignore
    }
    return DEFAULT_VOICE_SETTINGS;
  });

  const prevMsgRef = useRef<string | undefined>(undefined);

  const {
    isListening,
    transcript,
    error: recognitionError,
    isSupported: isRecSupported,
    start: startListening,
    stop: stopListening,
    clearTranscript,
  } = useSpeechRecognition();

  const {
    isSpeaking,
    voices,
    speak,
    stop: stopSpeaking,
  } = useSpeechSynthesis();

  // Display recognition errors
  useEffect(() => {
    if (recognitionError) {
      notify.error("Voice Recognition", recognitionError);
    }
  }, [recognitionError]);

  // Speak AI response when new assistant message arrives (if autoSpeak is enabled)
  useEffect(() => {
    if (
      lastAssistantMessage &&
      lastAssistantMessage !== prevMsgRef.current &&
      voiceSettings.autoSpeak &&
      !disabled &&
      !isListening
    ) {
      prevMsgRef.current = lastAssistantMessage;
      speak(
        lastAssistantMessage,
        voiceSettings,
        () => {
          if (voiceSettings.autoListen && isRecSupported) {
            startListening(voiceSettings.language, (finalText: string) => {
              if (finalText.trim()) {
                onSendMessage(finalText.trim());
              }
            });
          }
        },
      );
    }
  }, [
    lastAssistantMessage,
    voiceSettings,
    disabled,
    isListening,
    isRecSupported,
    speak,
    startListening,
    onSendMessage,
  ]);

  const handleSendText = (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setInput("");
    clearTranscript();
  };

  const handleStartListening = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    startListening(voiceSettings.language, (finalText: string) => {
      if (finalText.trim()) {
        handleSendText(finalText);
      }
    });
  };

  const handleToggleListen = () => {
    if (isListening) {
      stopListening();
      const textToSubmit = transcript || input;
      if (textToSubmit.trim()) {
        handleSendText(textToSubmit);
      }
    } else {
      handleStartListening();
    }
  };

  const handleSend = () => {
    if (isListening) {
      stopListening();
    }
    const textToSubmit = isListening ? transcript || input : input;
    handleSendText(textToSubmit);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const getVoiceState = (): VoiceState => {
    if (!isRecSupported) return "disabled";
    if (disabled) return "processing";
    if (isListening) return "listening";
    if (isSpeaking) return "speaking";
    return "idle";
  };

  const displayInputValue = isListening ? transcript || input : input;

  return (
    <div className="space-y-1">
      {/* Listening Banner */}
      {isListening && (
        <div className="flex items-center justify-between px-3 py-1 rounded-md bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20 animate-pulse">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive animate-ping" />
            <span>Listening... Speak into your microphone</span>
          </div>
          <button
            type="button"
            onClick={stopListening}
            className="text-[11px] underline font-semibold hover:opacity-80"
          >
            Done
          </button>
        </div>
      )}

      <div className="relative flex items-end gap-2 p-2 rounded-xl border bg-background shadow-md focus-within:ring-2 focus-within:ring-primary/20">
        <Textarea
          value={displayInputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? "Listening... transcript will appear here..."
              : "Ask AetherMind anything about your tasks, schedule, or productivity..."
          }
          disabled={disabled}
          rows={1}
          className="min-h-[44px] max-h-32 resize-none border-0 shadow-none focus-visible:ring-0 text-sm py-2.5 px-3"
        />

        {/* Voice Button */}
        <VoiceButton
          voiceState={getVoiceState()}
          onToggleListen={handleToggleListen}
          onStopSpeaking={stopSpeaking}
          disabled={disabled}
        />

        {/* Voice Settings Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setSettingsOpen(true)}
          title="Voice Assistant Settings"
          aria-label="Voice Assistant Settings"
          className="size-9 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <Sliders className="size-4" />
        </Button>

        {/* Send Button */}
        <Button
          type="button"
          onClick={handleSend}
          disabled={disabled || !displayInputValue.trim()}
          size="icon"
          aria-label="Send message"
          className="size-9 shrink-0 rounded-lg gap-1"
        >
          {disabled ? (
            <Sparkles className="size-4 animate-spin text-amber-300" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>

      {/* Voice Settings Modal */}
      <VoiceSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        voices={voices}
        settings={voiceSettings}
        onSaveSettings={setVoiceSettings}
      />
    </div>
  );
}

export default ChatInput;
