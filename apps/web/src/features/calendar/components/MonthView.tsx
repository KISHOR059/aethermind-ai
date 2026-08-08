import { useMemo } from "react";

import type { CalendarEvent } from "../calendar.types";
import {
  EMPTY_EVENTS,
  WEEKDAYS_SHORT,
  dateKey,
  getMonthGrid,
  isSameDay,
  isToday,
  isWeekend,
} from "../calendar.utils";
import MonthDayCell from "./MonthDayCell";
import { cn } from "@/shared/lib/cn";

export interface MonthViewProps {
  anchorDate: Date;
  eventsByDay: Map<string, CalendarEvent[]>;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onOpenDay: (date: Date) => void;
  onSelectTask: (event: CalendarEvent) => void;
}

export function MonthView({
  anchorDate,
  eventsByDay,
  selectedDate,
  onSelectDate,
  onOpenDay,
  onSelectTask,
}: MonthViewProps) {
  const rows = useMemo(() => {
    const grid = getMonthGrid(anchorDate);
    return Array.from({ length: 6 }, (_, index) =>
      grid.slice(index * 7, index * 7 + 7),
    );
  }, [anchorDate]);

  return (
    <div
      role="grid"
      aria-label={`Month view for ${anchorDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`}
      className="min-w-[640px] select-none"
    >
      <div
        role="row"
        className="grid grid-cols-7 border-b border-border/60 bg-muted"
      >
        {WEEKDAYS_SHORT.map((weekday, index) => (
          <div
            key={weekday}
            role="columnheader"
            className={cn(
              "px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
              index >= 5 && "text-muted-foreground/70",
            )}
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 border-l border-t border-border/50">
        {rows.map((week, rowIndex) => (
          <div key={rowIndex} role="row" className="grid grid-cols-7">
            {week.map((date) => (
              <MonthDayCell
                key={dateKey(date)}
                date={date}
                events={eventsByDay.get(dateKey(date)) ?? EMPTY_EVENTS}
                isToday={isToday(date)}
                isSelected={isSameDay(date, selectedDate)}
                isWeekend={isWeekend(date)}
                isOutsideMonth={date.getMonth() !== anchorDate.getMonth()}
                onSelectDate={onSelectDate}
                onOpenDay={onOpenDay}
                onSelectTask={onSelectTask}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MonthView;
