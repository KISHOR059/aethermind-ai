import { useState } from "react";
import { Bot, User as UserIcon, Volume2, VolumeX } from "lucide-react";
import type { Message } from "./assistant.types";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { cn } from "@/shared/lib/cn";
import { speechSynthesisService } from "./voice/SpeechSynthesisService";
import { DEFAULT_VOICE_SETTINGS, VOICE_SETTINGS_STORAGE_KEY, type VoiceSettings } from "./voice/voice.types";

export interface MessageBubbleProps {
  message: Message;
  userName?: string;
}

export function MessageBubble({ message, userName }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      speechSynthesisService.stop();
      setIsSpeaking(false);
      return;
    }

    let settings = DEFAULT_VOICE_SETTINGS;
    try {
      const saved = localStorage.getItem(VOICE_SETTINGS_STORAGE_KEY);
      if (saved) {
        settings = JSON.parse(saved) as VoiceSettings;
      }
    } catch {
      // Ignore storage errors
    }

    setIsSpeaking(true);
    speechSynthesisService.speak(message.content, settings, {
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 py-1.5 group",
        isUser ? "flex-row-reverse text-right" : "flex-row text-left",
      )}
    >
      <Avatar
        className={cn(
          "size-8 shrink-0 border",
          isUser
            ? "border-primary bg-primary text-primary-foreground"
            : "border-primary/20 bg-primary/10 text-primary",
        )}
      >
        <AvatarFallback
          className={
            isUser
              ? "bg-primary text-primary-foreground text-xs font-semibold"
              : "bg-primary/10 text-primary"
          }
        >
          {isUser ? (
            userName ? (
              userName.slice(0, 2).toUpperCase()
            ) : (
              <UserIcon className="size-4" />
            )
          ) : (
            <Bot className="size-4" />
          )}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm space-y-1.5 relative",
          isUser
            ? "rounded-tr-none bg-primary text-primary-foreground"
            : "rounded-tl-none bg-card border text-card-foreground",
          isSpeaking && "ring-2 ring-primary/40",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-medium opacity-70 flex items-center gap-1.5">
            <span>{isUser ? "You" : "AetherMind"}</span>
            {isSpeaking && (
              <span className="text-[10px] text-primary font-semibold animate-pulse flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-primary animate-ping" />
                Speaking...
              </span>
            )}
          </div>

          {!isUser && (
            <button
              type="button"
              onClick={handleToggleSpeak}
              title={isSpeaking ? "Stop speaking" : "Speak message"}
              aria-label={isSpeaking ? "Stop speaking" : "Speak message"}
              className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
            >
              {isSpeaking ? (
                <VolumeX className="size-3.5 text-primary" />
              ) : (
                <Volume2 className="size-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>

        {/* Execution Metrics Footer for Assistant */}
        {!isUser && message.metrics && (
          <div className="pt-2 mt-2 border-t border-border/50 text-[10px] text-muted-foreground flex flex-wrap items-center gap-2">
            <span>
              {message.metrics.provider} • {message.metrics.model} •{" "}
              {message.metrics.executionTime}ms
            </span>
            {message.metrics.tokenUsage && (
              <span>• {message.metrics.tokenUsage.totalTokens} tokens</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
