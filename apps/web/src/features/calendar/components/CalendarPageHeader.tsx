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
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 text-primary shadow-sm ring-1 ring-inset ring-primary/20">
          <Calendar className="size-5" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">
              {periodLabel}
            </span>
          </h1>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Calendar · Plan, schedule, and stay on top of your tasks.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
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
