import { useMemo } from "react";

import type { CalendarEvent } from "../calendar.types";
import { addDays, startOfWeek } from "../calendar.utils";
import TimelineGrid from "./TimelineGrid";

export interface WeekViewProps {
  anchorDate: Date;
  eventsByDay: Map<string, CalendarEvent[]>;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onSelectTask: (event: CalendarEvent) => void;
}

export function WeekView({
  anchorDate,
  eventsByDay,
  selectedDate,
  onSelectDate,
  onSelectTask,
}: WeekViewProps) {
  const days = useMemo(() => {
    const weekStart = startOfWeek(anchorDate);
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  }, [anchorDate]);

  return (
    <TimelineGrid
      days={days}
      eventsByDay={eventsByDay}
      selectedDate={selectedDate}
      onSelectDate={onSelectDate}
      onSelectTask={onSelectTask}
    />
  );
}

export default WeekView;
