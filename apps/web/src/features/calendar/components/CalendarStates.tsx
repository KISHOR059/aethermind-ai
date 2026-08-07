import { AlertCircle, CalendarDays, Plus, RefreshCw } from "lucide-react";

import type { CalendarView } from "../calendar.types";
import { WEEKDAYS_SHORT } from "../calendar.utils";
import CreateTaskDialog from "@/features/tasks/CreateTaskDialog";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function CalendarSkeleton({ view }: { view: CalendarView }) {
  if (view === "agenda") {
    return (
      <div className="space-y-6" aria-hidden="true">
        {[0, 1, 2].map((group) => (
          <div key={group} className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (view === "day" || view === "week") {
    const dayCount = view === "week" ? 7 : 1;
    return (
      <div className="min-w-[560px] space-y-4" aria-hidden="true">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `3.5rem repeat(${dayCount}, minmax(0, 1fr))`,
          }}
        >
          <Skeleton className="h-16 w-full rounded-xl" />
          {Array.from({ length: dayCount }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-xl" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-w-[640px]" aria-hidden="true">
      <div className="grid grid-cols-7 gap-2 border-b border-border/60 pb-3">
        {WEEKDAYS_SHORT.map((weekday) => (
          <Skeleton key={weekday} className="mx-auto h-3 w-10 rounded-md" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 pt-3">
        {Array.from({ length: 42 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function CalendarErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-4">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-foreground">
          Unable to load your calendar
        </h3>
        <p className="mx-auto max-w-md text-xs text-muted-foreground">
          {message}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
        <RefreshCw className="size-3.5" aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}

export function CalendarEmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border/80 bg-gradient-to-b from-card to-card/60 p-8 text-center shadow-sm md:p-12">
      <div className="relative mx-auto flex size-20 items-center justify-center">
        <div className="absolute size-20 animate-ping rounded-full bg-primary/10" />
        <div className="relative flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
          <CalendarDays className="size-8" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        <h3 className="text-lg font-bold tracking-tight text-foreground">
          No scheduled tasks
        </h3>
        <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground">
          {hasFilters
            ? "No tasks match your current search or filter criteria. Try clearing the filters."
            : "Your calendar is clear. Create a task with a due date and it will show up here."}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {hasFilters ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Clear filters
          </Button>
        ) : (
          <CreateTaskDialog
            trigger={
              <Button size="sm" className="gap-1.5 text-xs font-semibold">
                <Plus className="size-3.5" aria-hidden="true" />
                Create Task
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
