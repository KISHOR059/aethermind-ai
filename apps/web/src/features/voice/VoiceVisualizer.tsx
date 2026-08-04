import { useEffect, useRef } from "react";
import type { OfflineVoiceState } from "./voice.types";
import { cn } from "@/shared/lib/cn";

export interface VoiceVisualizerProps {
  voiceState: OfflineVoiceState;
  audioLevel?: number; // 0 to 1
  className?: string;
}

export function VoiceVisualizer({
  voiceState,
  audioLevel = 0,
  className,
}: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const isActive =
        voiceState === "listening" ||
        voiceState === "speaking" ||
        voiceState === "thinking" ||
        voiceState === "transcribing" ||
        voiceState === "generating_speech";

      if (!isActive) {
        // Flat baseline
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = "rgba(156, 163, 175, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        return;
      }

      phase += 0.15;
      const barCount = 24;
      const barWidth = width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        let barHeight: number;

        if (voiceState === "listening") {
          const sine = Math.sin(phase + i * 0.4);
          barHeight = 6 + (sine * 12 + 12) * Math.max(0.2, audioLevel * 1.8);
        } else if (voiceState === "speaking") {
          const sine = Math.cos(phase + i * 0.5);
          barHeight = 8 + (sine * 16 + 16);
        } else {
          // Processing / Thinking / Transcribing
          const sine = Math.sin(phase * 1.5 + i * 0.3);
          barHeight = 6 + Math.abs(sine) * 14;
        }

        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;

        let fillColor = "#3b82f6"; // Default Blue
        if (voiceState === "listening") fillColor = "#ef4444"; // Red pulse
        if (voiceState === "thinking" || voiceState === "transcribing")
          fillColor = "#8b5cf6"; // Purple glow
        if (voiceState === "generating_speech") fillColor = "#f59e0b"; // Amber glow

        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, Math.max(4, barHeight), 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [voiceState, audioLevel]);

  return (
    <div
      className={cn(
        "flex items-center justify-center p-2 rounded-lg bg-secondary/40 border border-border/50 transition-all",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        width={200}
        height={32}
        className="w-full h-8 block"
      />
    </div>
  );
}

export default VoiceVisualizer;
