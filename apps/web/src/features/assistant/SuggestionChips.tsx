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
  "Break down my authentication task.",
  "Reschedule today's work.",
  "How productive am I?",
  "Which task is blocking progress?",
  "How can I improve?",
  "Generate study plan.",
  "Prioritize my tasks.",
];

export function SuggestionChips({
  onSelectSuggestion,
  disabled,
}: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-2">
      {SUGGESTIONS.map((suggestion, idx) => (
        <Button
          key={idx}
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onSelectSuggestion(suggestion)}
          className="text-xs gap-1.5 rounded-full hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <Sparkles className="size-3 text-amber-500" />
          {suggestion}
        </Button>
      ))}
    </div>
  );
}

export default SuggestionChips;
