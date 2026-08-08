import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { calendarService } from "./calendar.service";
import type { CalendarView } from "./calendar.types";

const CALENDAR_VIEW_KEY = "aethermind-calendar-view";
const MOBILE_QUERY = "(max-width: 767px)";

export const calendarKeys = {
  all: ["calendar"] as const,
  range: (start: string, end: string) =>
    ["calendar", "events", start, end] as const,
};

function readStoredView(): CalendarView | null {
  try {
    const stored = window.localStorage.getItem(CALENDAR_VIEW_KEY);
    if (
      stored === "month" ||
      stored === "week" ||
      stored === "day" ||
      stored === "agenda"
    )
      return stored;
  } catch {
    return null;
  }
  return null;
}

export function isMobileViewport(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}

export function useCalendarViewPreference(initialView?: CalendarView) {
  const [view, setView] = useState<CalendarView>(
    () => initialView ?? readStoredView() ?? (isMobileViewport() ? "agenda" : "month"),
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(CALENDAR_VIEW_KEY, view);
    } catch {
      // storage may be unavailable (private mode / SSR) – non-fatal
    }
  }, [view]);

  return [view, setView] as const;
}

export function useCalendarEvents(startDate: string, endDate: string) {
  return useQuery({
    queryKey: calendarKeys.range(startDate, endDate),
    queryFn: ({ signal }) =>
      calendarService.getEvents({ startDate, endDate, view: "month" }, signal),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}
