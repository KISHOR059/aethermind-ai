import { Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";

export function TypingIndicator() {
  return (
    <div
      className="flex items-start gap-3 text-left py-2 animate-pulse"
      aria-live="polite"
      aria-label="AetherMind is typing..."
    >
      <Avatar className="size-8 border border-primary/20 bg-primary/10 text-primary">
        <AvatarFallback className="bg-primary/10 text-primary">
          <Bot className="size-4 animate-spin" />
        </AvatarFallback>
      </Avatar>

      <div className="rounded-2xl rounded-tl-none bg-muted/60 px-4 py-3 text-sm border shadow-sm space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <span>AetherMind thinking</span>
          <span className="flex gap-1">
            <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <span className="size-1.5 rounded-full bg-primary animate-bounce" />
          </span>
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;
