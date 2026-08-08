import { Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export interface SuggestionChipsProps {
  onSelectSuggestion: (prompt: string) => void;
  disabled?: boolean;
}

const SUGGESTIONS = [
  "What should I work on next?",
  "Plan tomorrow.",
  "Summarize my week.",
  "Prioritize my tasks.",
  "Break down my top task.",
  "How can I improve?",
];

export function SuggestionChips({
  onSelectSuggestion,
  disabled,
}: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {SUGGESTIONS.map((suggestion, idx) => (
        <Button
          key={idx}
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onSelectSuggestion(suggestion)}
          className="h-7 text-xs gap-1 rounded-full hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <Sparkles className="size-3 text-amber-500" />
          {suggestion}
        </Button>
      ))}
    </div>
  );
}

export default SuggestionChips;
