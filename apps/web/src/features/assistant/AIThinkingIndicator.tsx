import { Sparkles } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface AIThinkingIndicatorProps {
  className?: string;
  label?: string;
}

export function AIThinkingIndicator({
  className,
  label = "AetherMind is thinking",
}: AIThinkingIndicatorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="AetherMind is thinking and generating a response"
      className={cn(
        "group relative flex items-start gap-3 py-3 text-left animate-in fade-in duration-200 select-none",
        className,
      )}
    >
      {/* Stable AI Icon with subtle breath */}
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 mt-0.5 shadow-2xs">
        <Sparkles className="size-3.5 text-primary motion-safe:animate-pulse [animation-duration:2.5s] motion-reduce:animate-none" />
      </div>

      <div className="flex-1 min-w-0 space-y-2 py-0.5">
        {/* Thinking Label & Sequentially Pulsing Minimal Dots */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-foreground/80 tracking-tight">{label}</span>
          <span className="inline-flex items-center gap-1 text-primary" aria-hidden="true">
            <span className="size-1.5 rounded-full bg-primary/70 motion-safe:animate-pulse [animation-duration:1.2s] [animation-delay:0ms] motion-reduce:animate-none" />
            <span className="size-1.5 rounded-full bg-primary/70 motion-safe:animate-pulse [animation-duration:1.2s] [animation-delay:250ms] motion-reduce:animate-none" />
            <span className="size-1.5 rounded-full bg-primary/70 motion-safe:animate-pulse [animation-duration:1.2s] [animation-delay:500ms] motion-reduce:animate-none" />
          </span>
        </div>

        {/* Minimal Subtle Placeholder Shimmer Line */}
        <div className="h-3 w-44 rounded-md bg-muted/50 motion-safe:animate-pulse [animation-duration:2s] motion-reduce:animate-none border border-border/30" />
      </div>
    </div>
  );
}

export default AIThinkingIndicator;
