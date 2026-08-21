import { Sparkles, Calendar, CheckSquare, Compass, ListOrdered } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface SuggestionChipsProps {
  onSelectSuggestion: (prompt: string) => void;
  disabled?: boolean;
  className?: string;
}

const SUGGESTIONS = [
  {
    icon: Compass,
    label: "What should I focus on today?",
  },
  {
    icon: CheckSquare,
    label: "Summarize my upcoming tasks",
  },
  {
    icon: Sparkles,
    label: "Help me plan my day",
  },
  {
    icon: Calendar,
    label: "What meetings do I have this week?",
  },
  {
    icon: ListOrdered,
    label: "Prioritize my open tasks",
  },
];

export function SuggestionChips({
  onSelectSuggestion,
  disabled,
  className,
}: SuggestionChipsProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg", className)}>
      {SUGGESTIONS.map(({ icon: Icon, label }) => (
        <button
          key={label}
          type="button"
          disabled={disabled}
          onClick={() => onSelectSuggestion(label)}
          className="group flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/60 px-3.5 py-2.5 text-left text-xs font-medium text-foreground/90 transition-all duration-200 hover:border-primary/40 hover:bg-accent/60 hover:text-foreground active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 shadow-xs"
        >
          <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="size-3.5" />
          </div>
          <span className="truncate">{label}</span>
        </button>
      ))}
    </div>
  );
}

export default SuggestionChips;
