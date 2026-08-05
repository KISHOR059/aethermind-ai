import { AlertCircle, ClipboardList, RefreshCw } from "lucide-react";

import CreateTaskDialog from "./CreateTaskDialog";
import PlanMyDayDialog from "@/features/ai/PlanMyDayDialog";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function TaskEmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border/80 bg-gradient-to-b from-card to-card/60 p-8 md:p-12 text-center shadow-2xs my-6 max-w-xl mx-auto space-y-6">
      <div className="relative flex items-center justify-center mx-auto size-20">
        <div className="absolute size-20 animate-ping rounded-full bg-primary/10" />
        <div className="relative size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
          <ClipboardList className="size-8 text-primary" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-extrabold tracking-tight text-foreground">
          No tasks found
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
          No tasks match your current view or filter criteria. Create a new task or plan your day using AI.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <CreateTaskDialog />
        <PlanMyDayDialog />
      </div>
    </div>
  );
}

export function TaskLoadingState({ viewMode = "list" }: { viewMode?: "list" | "grid" }) {
  if (viewMode === "grid") {
    return (
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Skeleton key={idx} className="h-36 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <Skeleton key={idx} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function TaskErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-4 my-6">
      <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
        <AlertCircle className="size-6" />
      </div>
      <div className="space-y-1">
        <h4 className="text-base font-bold text-foreground">Unable to load tasks</h4>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">{message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
        <RefreshCw className="size-3.5" />
        Try again
      </Button>
    </div>
  );
}
