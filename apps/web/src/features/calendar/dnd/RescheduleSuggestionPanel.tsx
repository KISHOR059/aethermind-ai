import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Sparkles, X } from "lucide-react";

import type { RescheduleSuggestion } from "./use-calendar-reschedule";
import { Button } from "@/shared/components/ui/button";

export interface RescheduleSuggestionPanelProps {
  status: "idle" | "evaluating" | "ready";
  suggestion: RescheduleSuggestion | null;
  onAccept: () => void;
  onDismiss: () => void;
}

export function RescheduleSuggestionPanel({
  status,
  suggestion,
  onAccept,
  onDismiss,
}: RescheduleSuggestionPanelProps) {
  const visible = status !== "idle" || suggestion !== null;
  const canAccept = Boolean(suggestion?.suggestedDate);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="reschedule-suggestion"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="pointer-events-auto z-50 w-full max-w-sm rounded-xl border border-violet-500/30 bg-background/95 p-3 shadow-lg backdrop-blur"
        >
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-violet-500">
              <Sparkles className="size-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">
                  AI Suggestion
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onDismiss}
                  aria-label="Dismiss AI suggestion"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </Button>
              </div>

              {status === "evaluating" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2
                    className="size-4 animate-spin text-violet-500"
                    aria-hidden="true"
                  />
                  Analyzing your schedule for conflicts…
                </div>
              )}

              {status === "ready" && suggestion && (
                <>
                  <p className="text-sm leading-snug text-foreground">
                    {suggestion.reason}
                  </p>
                  {suggestion.conflictTitles.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {suggestion.conflictTitles.map((title) => (
                        <span
                          key={title}
                          className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                          overlaps {title}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}

              {status === "ready" && suggestion && (
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={onAccept}
                    disabled={!canAccept}
                  >
                    Accept
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={onDismiss}
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RescheduleSuggestionPanel;
