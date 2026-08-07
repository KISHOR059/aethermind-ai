import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Circle,
  CircleCheckBig,
  Clock3,
  LoaderCircle,
} from "lucide-react";

import type { CalendarEvent } from "../calendar.types";
import {
  addDays,
  formatShortDate,
  formatTimeRange,
  getEventStyle,
  isSameDay,
  startOfDay,
} from "../calendar.utils";
import { cn } from "@/shared/lib/cn";

export interface AgendaItemProps {
  event: CalendarEvent;
  showDate?: boolean;
  onSelect: (event: CalendarEvent) => void;
  onToggleComplete: (event: CalendarEvent) => void;
}

export const AgendaItem = memo(function AgendaItem({
  event,
  showDate = false,
  onSelect,
  onToggleComplete,
}: AgendaItemProps) {
  const style = getEventStyle(event);
  const isCompleted = event.status === "COMPLETED";

  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(event)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(event);
        }
      }}
      aria-label={`Open task ${event.title}`}
      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:border-primary/30 hover:shadow-sm"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(event);
        }}
        aria-label={
          isCompleted
            ? `Mark ${event.title} as incomplete`
            : `Mark ${event.title} as complete`
        }
        className="shrink-0 text-muted-foreground transition-colors hover:text-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
      >
        {isCompleted ? (
          <CircleCheckBig className="size-5 text-emerald-500" />
        ) : event.status === "IN_PROGRESS" ? (
          <LoaderCircle className="size-5 text-blue-500 animate-spin-slow" />
        ) : (
          <Circle className="size-5 hover:scale-110 transition-transform" />
        )}
      </button>

      <span
        className={cn("size-2 shrink-0 rounded-full", style.dot)}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium text-foreground",
            isCompleted && "line-through text-muted-foreground",
          )}
        >
          {event.title}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock3 className="size-3" aria-hidden="true" />
          <span>{formatTimeRange(event)}</span>
          {showDate && (
            <span className="font-medium text-muted-foreground/70">
              · {formatShortDate(new Date(event.start))}
            </span>
          )}
        </p>
      </div>

      <span className="hidden shrink-0 rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground sm:inline-block">
        {event.priority.charAt(0) + event.priority.slice(1).toLowerCase()}
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />
    </motion.div>
  );
});

export interface AgendaViewProps {
  events: CalendarEvent[];
  onSelectTask: (event: CalendarEvent) => void;
  onToggleComplete: (event: CalendarEvent) => void;
}

export function AgendaView({
  events,
  onSelectTask,
  onToggleComplete,
}: AgendaViewProps) {
  const groups = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const buckets: Array<{
      key: string;
      label: string;
      date: Date;
      events: CalendarEvent[];
    }> = [
      { key: "today", label: "Today", date: today, events: [] },
      { key: "tomorrow", label: "Tomorrow", date: tomorrow, events: [] },
      { key: "upcoming", label: "Upcoming", date: tomorrow, events: [] },
    ];

    for (const event of events) {
      const day = startOfDay(new Date(event.start));
      if (isSameDay(day, today)) buckets[0].events.push(event);
      else if (isSameDay(day, tomorrow)) buckets[1].events.push(event);
      else buckets[2].events.push(event);
    }

    return buckets.filter((bucket) => bucket.events.length > 0);
  }, [events]);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label}>
          <div className="mb-3 flex items-baseline gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              {group.label}
            </h2>
            <span className="text-xs font-medium text-muted-foreground">
              {group.key === "upcoming"
                ? "and beyond"
                : formatShortDate(group.date)}
            </span>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {group.events.length}{" "}
              {group.events.length === 1 ? "task" : "tasks"}
            </span>
          </div>
          <div className="space-y-2">
            {group.events.map((event) => (
              <AgendaItem
                key={event.id}
                event={event}
                showDate={group.key === "upcoming"}
                onSelect={onSelectTask}
                onToggleComplete={onToggleComplete}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default AgendaView;
