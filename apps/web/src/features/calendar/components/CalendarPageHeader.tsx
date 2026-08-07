import { Calendar, Plus, Target } from "lucide-react";

import { Button } from "@/shared/components/ui/button";

export interface CalendarPageHeaderProps {
  periodLabel: string;
  onToday: () => void;
  onCreateTask: () => void;
}

export function CalendarPageHeader({
  periodLabel,
  onToday,
  onCreateTask,
}: CalendarPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/50">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl border border-border/60 bg-card text-primary shadow-sm">
          <Calendar className="size-4" aria-hidden="true" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Calendar
          </h1>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Plan, schedule, and stay on top of your tasks.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-sm font-medium text-muted-foreground md:block">
          {periodLabel}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="gap-1.5 text-xs font-semibold"
        >
          <Target className="size-3.5" aria-hidden="true" />
          Today
        </Button>
        <Button
          size="sm"
          onClick={onCreateTask}
          className="gap-1.5 text-xs font-semibold"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Create Task
        </Button>
      </div>
    </div>
  );
}

export default CalendarPageHeader;
