import { createContext, useContext } from "react";

import type { CalendarEvent } from "../calendar.types";
import type { TimeGridHover } from "./dnd.types";

export type CalendarDndContextValue = {
  activeEvent: CalendarEvent | null;
  hoveredTime: TimeGridHover | null;
};

export const CalendarDndContext = createContext<CalendarDndContextValue>({
  activeEvent: null,
  hoveredTime: null,
});

export function useCalendarDnd(): CalendarDndContextValue {
  return useContext(CalendarDndContext);
}
