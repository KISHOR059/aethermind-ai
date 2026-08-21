import { useState } from "react";
import { Bot, Copy, Check, Volume2, VolumeX, Sparkles, Activity } from "lucide-react";
import type { Message } from "./assistant.types";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { AIMarkdown } from "./AIMarkdown";
import { cn } from "@/shared/lib/cn";
import { speechSynthesisService } from "./voice/SpeechSynthesisService";
import {
  DEFAULT_VOICE_SETTINGS,
  VOICE_SETTINGS_STORAGE_KEY,
  type VoiceSettings,
} from "./voice/voice.types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";

export interface MessageBubbleProps {
  message: Message;
  userName?: string;
}

export function MessageBubble({ message, userName }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

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

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "ME";

  if (isUser) {
    return (
      <div className="group flex items-start justify-end gap-2.5 py-2 animate-in fade-in duration-150">
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%] space-y-1">
          <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-xs sm:text-sm text-primary-foreground shadow-xs">
            <p className="whitespace-pre-wrap leading-relaxed break-words">{message.content}</p>
          </div>
        </div>
        <Avatar className="size-7 shrink-0 border border-primary/30 mt-0.5">
          <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  // AI Assistant response: Structured workspace content
  return (
    <div className="group relative flex items-start gap-3 py-3 text-left animate-in fade-in duration-200">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 mt-0.5">
        <Bot className="size-3.5" />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {/* Author & Status bar */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground tracking-tight text-xs">AetherMind</span>
            {isSpeaking && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-primary animate-pulse">
                <span className="size-1.5 rounded-full bg-primary animate-ping" />
                Speaking…
              </span>
            )}
          </div>

          {/* Action buttons toolbar */}
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleCopyText}
                  aria-label={copied ? "Copied" : "Copy response"}
                  className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-[11px]">{copied ? "Copied!" : "Copy response"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleToggleSpeak}
                  aria-label={isSpeaking ? "Stop speaking" : "Speak response"}
                  className={cn(
                    "flex size-6 items-center justify-center rounded-md transition-colors",
                    isSpeaking
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {isSpeaking ? <VolumeX className="size-3" /> : <Volume2 className="size-3" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-[11px]">{isSpeaking ? "Stop speaking" : "Read aloud"}</p>
              </TooltipContent>
            </Tooltip>

            {message.metrics && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setShowMetrics(!showMetrics)}
                    aria-label="Toggle metrics"
                    className={cn(
                      "flex size-6 items-center justify-center rounded-md transition-colors",
                      showMetrics
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Activity className="size-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-[11px]">Execution metrics</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Structured Content Area */}
        <div className="text-xs sm:text-sm text-foreground/95 leading-relaxed">
          <AIMarkdown content={message.content} />
        </div>

        {/* Execution Metrics detail pill */}
        {message.metrics && showMetrics && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-muted-foreground font-mono">
            <span className="inline-flex items-center gap-1 rounded bg-muted/60 px-2 py-0.5 border border-border/40">
              <Sparkles className="size-2.5 text-primary" />
              {message.metrics.provider} • {message.metrics.model}
            </span>
            <span className="rounded bg-muted/60 px-2 py-0.5 border border-border/40">
              {message.metrics.executionTime}ms
            </span>
            {message.metrics.tokenUsage && (
              <span className="rounded bg-muted/60 px-2 py-0.5 border border-border/40">
                {message.metrics.tokenUsage.totalTokens} tokens
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
