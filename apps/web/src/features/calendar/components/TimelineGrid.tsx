import { forwardRef, memo } from "react";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";

import type { CalendarEvent } from "../calendar.types";
import {
  HOUR_END,
  HOUR_START,
  WEEKDAYS_SHORT,
  dateKey,
  formatTime,
  getEventPosition,
  getEventStyle,
  isSameDay,
  isToday,
  isWeekend,
} from "../calendar.utils";
import DraggableTaskPill from "../dnd/DraggableTaskPill";
import DraggableTimelineBlock from "../dnd/DraggableTimelineBlock";
import {
  DND,
  allDayDropId,
  dayDropId,
  timeDropId,
} from "../dnd/dnd.types";
import { useCalendarDnd } from "../dnd/calendar-dnd-context";
import { cn } from "@/shared/lib/cn";

const TIME_GRID_HEIGHT = 480;
const TIME_BAND_MINUTES = 30;
const TOTAL_MINUTES = (HOUR_END - HOUR_START) * 60;

function formatHourLabel(hour: number): string {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric" }).format(
    new Date(2000, 0, 1, hour),
  );
}

function hourOffset(hour: number): number {
  return ((hour - HOUR_START) / (HOUR_END - HOUR_START)) * 100;
}

export interface TimelineEventBlockProps {
  event: CalendarEvent;
  onSelect: (event: CalendarEvent) => void;
  style?: CSSProperties;
}

export const TimelineEventBlock = memo(
  forwardRef<HTMLButtonElement, TimelineEventBlockProps>(
    function TimelineEventBlock({ event, onSelect, style: styleProp }, ref) {
      const { top, height } = getEventPosition(event);
      const style = getEventStyle(event);
      const start = new Date(event.start);

      return (
        <motion.button
          ref={ref}
          type="button"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.15 }}
          onClick={() => onSelect(event)}
          style={{ top: `${top}%`, height: `${height}%`, ...styleProp }}
          className={cn(
            "absolute left-0.5 right-0.5 z-10 flex min-h-5 flex-col justify-center overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-[11px] leading-tight shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            style.pill,
          )}
          aria-label={`${event.title}, ${formatTime(start)}`}
        >
          <span className="truncate font-semibold">{event.title}</span>
          {height > 8 && (
            <span className="truncate text-[10px] opacity-75">
              {formatTime(start)}
            </span>
          )}
        </motion.button>
      );
    },
  ),
);

interface DayHeaderDropButtonProps {
  day: Date;
  isSingleDay: boolean;
  selected: boolean;
  onSelectDate: (date: Date) => void;
}

const DayHeaderDropButton = memo(function DayHeaderDropButton({
  day,
  isSingleDay,
  selected,
  onSelectDate,
}: DayHeaderDropButtonProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: dayDropId(day),
    data: { type: DND.DAY_DROP, date: day },
  });
  const today = isToday(day);

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onSelectDate(day)}
      className={cn(
        "flex flex-col items-center gap-1 border-l border-border/40 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        isWeekend(day) && "bg-muted/20",
        selected && "bg-primary/5",
        isOver && "bg-primary/10 ring-2 ring-inset ring-primary/60",
      )}
      aria-label={day.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}
    >
      {!isSingleDay && (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {WEEKDAYS_SHORT[(day.getDay() + 6) % 7]}
        </span>
      )}
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full text-sm font-medium",
          today
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-foreground",
          selected && !today && "ring-2 ring-primary/40",
        )}
      >
        {day.getDate()}
      </span>
      {isSingleDay && (
        <span className="text-[10px] font-medium text-muted-foreground">
          {day.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </span>
      )}
    </button>
  );
});

interface AllDayDropCellProps {
  day: Date;
  events: readonly CalendarEvent[];
  onSelectTask: (event: CalendarEvent) => void;
}

const AllDayDropCell = memo(function AllDayDropCell({
  day,
  events,
  onSelectTask,
}: AllDayDropCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: allDayDropId(day),
    data: { type: DND.ALL_DAY_DROP, date: day },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-0.5 border-l border-border/40 px-0.5 py-0.5",
        isOver && "bg-primary/10 ring-2 ring-inset ring-primary/60",
      )}
    >
      {events.map((event) => (
        <DraggableTaskPill
          key={event.id}
          event={event}
          onSelect={onSelectTask}
          className="py-[2px]"
        />
      ))}
    </div>
  );
});

interface TimeDropColumnProps {
  day: Date;
  events: readonly CalendarEvent[];
  onSelectTask: (event: CalendarEvent) => void;
}

const TimeDropColumn = memo(function TimeDropColumn({
  day,
  events,
  onSelectTask,
}: TimeDropColumnProps) {
  const id = timeDropId(day);
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: DND.TIME_DROP, date: day },
  });
  const { hoveredTime } = useCalendarDnd();
  const hovered = hoveredTime?.containerId === id ? hoveredTime : null;

  const bandTop = hovered
    ? ((hovered.minutes - HOUR_START * 60) / TOTAL_MINUTES) * 100
    : 0;
  const bandHeight = (TIME_BAND_MINUTES / TOTAL_MINUTES) * 100;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative h-full border-l border-border/40",
        isWeekend(day) && "bg-muted/20",
        isOver && "bg-primary/10",
      )}
    >
      {hovered && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-primary/50 bg-primary/15"
          style={{ top: `${bandTop}%`, height: `${bandHeight}%` }}
        />
      )}
      {events.map((event) => (
        <DraggableTimelineBlock
          key={event.id}
          event={event}
          onSelect={onSelectTask}
        />
      ))}
    </div>
  );
});

export interface TimelineGridProps {
  days: Date[];
  eventsByDay: Map<string, CalendarEvent[]>;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onSelectTask: (event: CalendarEvent) => void;
}

export function TimelineGrid({
  days,
  eventsByDay,
  selectedDate,
  onSelectDate,
  onSelectTask,
}: TimelineGridProps) {
  const hours = Array.from(
    { length: HOUR_END - HOUR_START + 1 },
    (_, index) => HOUR_START + index,
  );
  const gridTemplate = `3.5rem repeat(${days.length}, minmax(0, 1fr))`;
  const isSingleDay = days.length === 1;

  return (
    <div className="min-w-[560px] select-none">
      {/* Day headers */}
      <div
        className="grid border-b border-border/60"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        <div aria-hidden="true" />
        {days.map((day) => (
          <DayHeaderDropButton
            key={dateKey(day)}
            day={day}
            isSingleDay={isSingleDay}
            selected={isSameDay(day, selectedDate)}
            onSelectDate={onSelectDate}
          />
        ))}
      </div>

      {/* All-day strip */}
      <div
        className="grid border-b border-border/40"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        <div className="flex items-center justify-end pr-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          All day
        </div>
        {days.map((day) => (
          <AllDayDropCell
            key={dateKey(day)}
            day={day}
            events={
              eventsByDay.get(dateKey(day))?.filter((event) => event.allDay) ??
              []
            }
            onSelectTask={onSelectTask}
          />
        ))}
      </div>

      {/* Time grid */}
      <div className="relative" style={{ height: TIME_GRID_HEIGHT }}>
        {hours.map((hour) => (
          <div
            key={hour}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 border-t border-border/40"
            style={{ top: `${hourOffset(hour)}%` }}
          />
        ))}
        <div
          className="grid h-full"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <div className="relative h-full">
            {hours.map((hour) => (
              <span
                key={hour}
                aria-hidden="true"
                className="absolute right-2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground"
                style={{ top: `${hourOffset(hour)}%` }}
              >
                {formatHourLabel(hour)}
              </span>
            ))}
          </div>
          {days.map((day) => (
            <TimeDropColumn
              key={dateKey(day)}
              day={day}
              events={
                eventsByDay
                  .get(dateKey(day))
                  ?.filter((event) => !event.allDay) ?? []
              }
              onSelectTask={onSelectTask}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default TimelineGrid;
