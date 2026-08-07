import { memo } from "react";

import type { CalendarEvent } from "../calendar.types";
import { MAX_VISIBLE_TASKS } from "../calendar.utils";
import TaskPill from "./TaskPill";
import { cn } from "@/shared/lib/cn";

export interface MonthDayCellProps {
  date: Date;
  events: readonly CalendarEvent[];
  isToday: boolean;
  isSelected: boolean;
  isWeekend: boolean;
  isOutsideMonth: boolean;
  onSelectDate: (date: Date) => void;
  onOpenDay: (date: Date) => void;
  onSelectTask: (event: CalendarEvent) => void;
}

export const MonthDayCell = memo(function MonthDayCell({
  date,
  events,
  isToday,
  isSelected,
  isWeekend,
  isOutsideMonth,
  onSelectDate,
  onOpenDay,
  onSelectTask,
}: MonthDayCellProps) {
  const visible = events.slice(0, MAX_VISIBLE_TASKS);
  const overflow = events.length - MAX_VISIBLE_TASKS;

  return (
    <div
      role="gridcell"
      aria-selected={isSelected}
      aria-label={`${date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}, ${events.length} task${events.length === 1 ? "" : "s"}`}
      onClick={() => onSelectDate(date)}
      onDoubleClick={() => onOpenDay(date)}
      className={cn(
        "group relative flex min-h-[7.5rem] flex-col gap-1 border-r border-b border-border/50 p-1.5 transition-colors last:border-r-0 focus-within:z-10",
        isOutsideMonth
          ? "bg-muted/30"
          : isWeekend
            ? "bg-muted/20"
            : "bg-background",
        isSelected && "bg-primary/5",
      )}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDay(date);
          }}
          aria-label={`Open day view for ${date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}`}
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isToday
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-foreground hover:bg-accent",
            isOutsideMonth && !isToday && "text-muted-foreground/70",
            isSelected && !isToday && "ring-2 ring-primary/40",
          )}
        >
          {date.getDate()}
        </button>
        {events.length > 0 && (
          <span className="hidden text-[10px] font-medium text-muted-foreground/70 sm:block">
            {events.length}
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
        {visible.map((event) => (
          <TaskPill key={event.id} event={event} onSelect={onSelectTask} />
        ))}
        {overflow > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDay(date);
            }}
            className="rounded-md px-1.5 py-0.5 text-left text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Open ${overflow} more tasks on ${date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}`}
          >
            +{overflow} more
          </button>
        )}
      </div>
    </div>
  );
});

export default MonthDayCell;
