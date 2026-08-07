import { useMemo } from "react";

import type { CalendarEvent } from "../calendar.types";
import { startOfDay } from "../calendar.utils";
import TimelineGrid from "./TimelineGrid";

export interface DayViewProps {
  anchorDate: Date;
  eventsByDay: Map<string, CalendarEvent[]>;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onSelectTask: (event: CalendarEvent) => void;
}

export function DayView({
  anchorDate,
  eventsByDay,
  selectedDate,
  onSelectDate,
  onSelectTask,
}: DayViewProps) {
  const day = useMemo(() => startOfDay(anchorDate), [anchorDate]);

  return (
    <TimelineGrid
      days={[day]}
      eventsByDay={eventsByDay}
      selectedDate={selectedDate}
      onSelectDate={onSelectDate}
      onSelectTask={onSelectTask}
    />
  );
}

export default DayView;
