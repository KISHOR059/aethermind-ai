import { Mic, Square, LoaderCircle, Sparkles, Volume2, Cpu } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { OfflineVoiceState, VoicePerformanceMetrics } from "./voice.types";
import { VoiceVisualizer } from "./VoiceVisualizer";
import { VoicePlayer } from "./VoicePlayer";
import { cn } from "@/shared/lib/cn";

export interface VoiceControlsProps {
  voiceState: OfflineVoiceState;
  audioLevel: number;
  responseAudioBuffer?: ArrayBuffer | null;
  metrics?: VoicePerformanceMetrics | null;
  onStartListen: () => void;
  onStopListen: () => void;
  onCancelListen: () => void;
  onAudioEnded: () => void;
  className?: string;
}

export function VoiceControls({
  voiceState,
  audioLevel,
  responseAudioBuffer,
  metrics,
  onStartListen,
  onStopListen,
  onCancelListen,
  onAudioEnded,
  className,
}: VoiceControlsProps) {
  const isListening = voiceState === "listening";
  const isProcessing =
    voiceState === "uploading" ||
    voiceState === "transcribing" ||
    voiceState === "thinking" ||
    voiceState === "generating_speech";
  const isSpeaking = voiceState === "speaking";

  const getStateLabel = () => {
    switch (voiceState) {
      case "listening":
        return "Listening (speak clearly)...";
      case "uploading":
        return "Uploading audio...";
      case "transcribing":
        return "Transcribing with Whisper.cpp...";
      case "thinking":
        return "AI Assistant thinking...";
      case "generating_speech":
        return "Synthesizing speech with Piper TTS...";
      case "speaking":
        return "Speaking response aloud...";
      default:
        return "Offline AI Voice Assistant";
    }
  };

  return (
    <div
      className={cn(
        "p-3 rounded-xl border bg-card/60 backdrop-blur-md shadow-sm space-y-2 transition-all",
        isListening && "border-destructive/40 bg-destructive/5 ring-1 ring-destructive/20",
        isSpeaking && "border-primary/40 bg-primary/5 ring-1 ring-primary/20",
        className,
      )}
    >
      {/* Top Header & Action */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          {isListening && (
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-destructive" />
            </span>
          )}

          {isProcessing && <LoaderCircle className="size-3.5 animate-spin text-purple-500" />}
          {isSpeaking && <Volume2 className="size-3.5 text-primary animate-bounce" />}
          {!isListening && !isProcessing && !isSpeaking && (
            <Cpu className="size-3.5 text-muted-foreground" />
          )}

          <span className="text-foreground/90">{getStateLabel()}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {isListening ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={onStopListen}
                className="h-7 text-xs gap-1.5 px-2.5"
              >
                <Square className="size-3 fill-current" />
                Done
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onCancelListen}
                className="h-7 text-xs text-muted-foreground"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              variant={isSpeaking ? "outline" : "default"}
              onClick={onStartListen}
              disabled={isProcessing}
              className="h-7 text-xs gap-1.5 px-3"
            >
              {isProcessing ? (
                <Sparkles className="size-3 animate-spin" />
              ) : (
                <Mic className="size-3" />
              )}
              {isSpeaking ? "Speak Again" : "Voice Input"}
            </Button>
          )}
        </div>
      </div>

      {/* Visualizer Waveform */}
      <VoiceVisualizer voiceState={voiceState} audioLevel={audioLevel} />

      {/* Response Player */}
      {isSpeaking && responseAudioBuffer && (
        <VoicePlayer
          audioBuffer={responseAudioBuffer}
          onEnded={onAudioEnded}
          autoPlay
        />
      )}

      {/* Metrics Footer (Observability) */}
      {metrics && metrics.totalResponseTimeMs && (
        <div className="text-[10px] text-muted-foreground font-mono flex items-center justify-between pt-1 border-t border-border/40">
          <span>
            STT: {metrics.transcriptionTimeMs ?? 0}ms | AI: {metrics.aiInferenceTimeMs ?? 0}ms | TTS: {metrics.speechGenerationTimeMs ?? 0}ms
          </span>
          <span className="font-semibold text-primary">
            Total: {metrics.totalResponseTimeMs}ms
          </span>
        </div>
      )}
    </div>
  );
}

export default VoiceControls;
