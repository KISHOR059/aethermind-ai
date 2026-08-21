import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { ArrowUp, Sparkles, SlidersHorizontal, Mic, MicOff } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { VoiceSettingsDialog } from "./voice/VoiceSettingsDialog";
import { useSpeechRecognition } from "./voice/useSpeechRecognition";
import { useSpeechSynthesis } from "./voice/useSpeechSynthesis";
import {
  DEFAULT_VOICE_SETTINGS,
  VOICE_SETTINGS_STORAGE_KEY,
  type VoiceSettings,
} from "./voice/voice.types";
import { notify } from "@/shared/lib/notifications";
import { cn } from "@/shared/lib/cn";

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  lastAssistantMessage?: string;
  className?: string;
}

export function ChatInput({
  onSendMessage,
  disabled,
  lastAssistantMessage,
  className,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMsgRef = useRef<string | undefined>(undefined);

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(VOICE_SETTINGS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<VoiceSettings>;
          const normalized: VoiceSettings = {
            ...DEFAULT_VOICE_SETTINGS,
            ...parsed,
            autoSpeak: false,
          };
          localStorage.setItem(VOICE_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
          return normalized;
        }
      }
    } catch {
      // Ignore
    }
    return DEFAULT_VOICE_SETTINGS;
  });

  const {
    isListening,
    transcript,
    error: recognitionError,
    isSupported: isRecSupported,
    start: startListening,
    stop: stopListening,
    clearTranscript,
  } = useSpeechRecognition();

  const { isSpeaking, voices, speak, stop: stopSpeaking } = useSpeechSynthesis();

  // Resize textarea on content change
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 160);
    textarea.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, transcript, adjustTextareaHeight]);

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
      speak(lastAssistantMessage, voiceSettings, () => {
        if (voiceSettings.autoListen && isRecSupported) {
          startListening(voiceSettings.language, (finalText: string) => {
            if (finalText.trim()) {
              onSendMessage(finalText.trim());
            }
          });
        }
      });
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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
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

  const displayInputValue = isListening ? transcript || input : input;
  const canSend = Boolean(displayInputValue.trim()) && !disabled;

  return (
    <div className={cn("relative w-full", className)}>
      {/* Listening status indicator */}
      {isListening && (
        <div className="mb-2 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs text-primary animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <span>Listening to your voice…</span>
          </div>
          <button
            type="button"
            onClick={stopListening}
            className="text-[11px] font-semibold text-primary underline hover:opacity-80 transition-opacity"
          >
            Done
          </button>
        </div>
      )}

      {/* Floating Composer Container */}
      <div className="relative rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md shadow-lg shadow-black/5 dark:shadow-black/20 transition-all duration-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
        <textarea
          ref={textareaRef}
          value={displayInputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? "Listening... speaking will transcribe here..."
              : "Ask AetherMind anything about your tasks, schedule, or productivity..."
          }
          disabled={disabled}
          rows={1}
          aria-label="Ask AetherMind"
          className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 outline-none leading-relaxed overflow-y-auto"
          style={{ minHeight: "44px", maxHeight: "160px" }}
        />

        {/* Composer Controls Bar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          <div className="flex items-center gap-1">
            {/* Speech Recognition Toggle */}
            {isRecSupported && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleListen}
                    disabled={disabled}
                    aria-label={isListening ? "Stop voice input" : "Voice input"}
                    className={cn(
                      "size-8 rounded-lg transition-colors",
                      isListening
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 animate-pulse"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70",
                    )}
                  >
                    {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-[11px]">{isListening ? "Stop listening" : "Voice input"}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Voice Settings Dialog Trigger */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Voice settings"
                  className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70"
                >
                  <SlidersHorizontal className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-[11px]">Voice settings</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] text-muted-foreground/60 select-none">
              <kbd className="font-sans">↵</kbd> send • <kbd className="font-sans">shift+↵</kbd> newline
            </span>

            {/* Send Button */}
            <Button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              size="icon"
              aria-label="Send prompt"
              className={cn(
                "size-8 rounded-xl transition-all duration-200",
                canSend
                  ? "bg-primary text-primary-foreground shadow-xs hover:opacity-90"
                  : "bg-muted text-muted-foreground/40 cursor-not-allowed",
              )}
            >
              {disabled ? (
                <Sparkles className="size-3.5 animate-spin text-primary" />
              ) : (
                <ArrowUp className="size-4 stroke-[2.5]" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Voice Settings Dialog */}
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
