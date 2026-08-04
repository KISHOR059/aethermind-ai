import React from "react";
import { Mic, MicOff, LoaderCircle, Volume2, Square } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { VoiceState } from "./voice.types";
import { cn } from "@/shared/lib/cn";

export interface VoiceButtonProps {
  voiceState: VoiceState;
  onToggleListen: () => void;
  onStopSpeaking?: () => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceButton({
  voiceState,
  onToggleListen,
  onStopSpeaking,
  disabled,
  className,
}: VoiceButtonProps) {
  const isUnsupported = voiceState === "disabled";

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isUnsupported || disabled) return;

    if (voiceState === "speaking") {
      onStopSpeaking?.();
    } else {
      onToggleListen();
    }
  };

  const getLabelAndTooltip = (): string => {
    switch (voiceState) {
      case "listening":
        return "Listening... Click to stop or submit speech";
      case "processing":
        return "Processing speech...";
      case "speaking":
        return "Speaking response... Click to stop voice output";
      case "disabled":
        return "Voice input is not supported in this browser.";
      default:
        return "Click to speak with AetherMind";
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleClick}
      disabled={isUnsupported || (disabled && voiceState !== "speaking")}
      title={getLabelAndTooltip()}
      aria-label={getLabelAndTooltip()}
      className={cn(
        "size-9 shrink-0 rounded-lg transition-all duration-200 relative overflow-hidden",
        voiceState === "listening" &&
          "border-destructive bg-destructive/10 text-destructive ring-2 ring-destructive/30 animate-pulse",
        voiceState === "speaking" &&
          "border-primary bg-primary/10 text-primary ring-2 ring-primary/30",
        className,
      )}
    >
      {voiceState === "listening" && (
        <span className="relative flex size-4 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
          <Mic className="size-4 text-destructive relative z-10" />
        </span>
      )}

      {voiceState === "processing" && (
        <LoaderCircle className="size-4 animate-spin text-primary" />
      )}

      {voiceState === "speaking" && (
        <span className="relative flex items-center justify-center">
          <Volume2 className="size-4 text-primary animate-bounce" />
          <Square className="size-2 absolute bottom-0 right-0 fill-current text-primary" />
        </span>
      )}

      {voiceState === "idle" && <Mic className="size-4 text-muted-foreground hover:text-foreground" />}

      {voiceState === "disabled" && <MicOff className="size-4 text-muted-foreground/40" />}
    </Button>
  );
}

export default VoiceButton;
