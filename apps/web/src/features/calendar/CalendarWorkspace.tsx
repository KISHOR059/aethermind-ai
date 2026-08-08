import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";

import type { CalendarEvent, CalendarFilters } from "./calendar.types";
import { useCalendarEvents, useCalendarViewPreference } from "./calendar.hooks";
import {
  EMPTY_EVENTS,
  addDays,
  addMonths,
  dateKey,
  eventToTask,
  formatLongDate,
  formatMonthYear,
  formatShortDate,
  getMonthGrid,
  groupEventsByDay,
  hasActiveCalendarFilters,
  matchesEventFilters,
  startOfDay,
  startOfWeek,
  toDateOnly,
} from "./calendar.utils";
import AgendaView from "./components/AgendaView";
import CalendarLegend from "./components/CalendarLegend";
import CalendarPageHeader from "./components/CalendarPageHeader";
import CalendarToolbar from "./components/CalendarToolbar";
import DayView from "./components/DayView";
import MonthView from "./components/MonthView";
import WeekView from "./components/WeekView";
import {
  CalendarEmptyState,
  CalendarErrorState,
  CalendarSkeleton,
} from "./components/CalendarStates";
import CreateTaskDialog from "@/features/tasks/CreateTaskDialog";
import TaskDetailsDrawer from "@/features/tasks/TaskDetailsDrawer";
import { useUpdateTask } from "@/features/tasks/task.hooks";
import { notify } from "@/shared/lib/notifications";
import CalendarDndRoot from "./dnd/calendar-dnd";
import type { CalendarDropResult } from "./dnd/calendar-dnd";
import RescheduleSuggestionPanel from "./dnd/RescheduleSuggestionPanel";
import {
  useRescheduleSuggestion,
  useRescheduleTask,
} from "./dnd/use-calendar-reschedule";

const AGENDA_RANGE_DAYS = 45;

export function CalendarWorkspace() {
  const [searchParams] = useSearchParams();
  const urlView = searchParams.get("view");
  const initialView = urlView === "month" || urlView === "week" || urlView === "day" || urlView === "agenda" ? urlView : undefined;
  const [view, setView] = useCalendarViewPreference(initialView);
  const [anchorDate, setAnchorDate] = useState<Date>(() =>
    startOfDay(new Date()),
  );
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    startOfDay(new Date()),
  );
  const [filters, setFilters] = useState<CalendarFilters>({
    search: "",
    status: "ALL",
    priority: "ALL",
  });
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  const [lastUrlParams, setLastUrlParams] = useState(searchParams);
  if (lastUrlParams !== searchParams) {
    setLastUrlParams(searchParams);
    const viewParam = searchParams.get("view");
    if (viewParam === "month" || viewParam === "week" || viewParam === "day" || viewParam === "agenda") {
      setView(viewParam);
    }
    const dateParam = searchParams.get("date");
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const date = startOfDay(new Date(`${dateParam}T00:00:00`));
      setAnchorDate(date);
      setSelectedDate(date);
      setFocusedKey(dateKey(date));
    }
  }

  const searchInputRef = useRef<HTMLInputElement>(null);
  const updateTask = useUpdateTask();
  const reschedule = useRescheduleTask();
  const {
    status: suggestionStatus,
    suggestion,
    evaluate: evaluateSuggestion,
    dismiss: dismissSuggestion,
  } = useRescheduleSuggestion();

  const range = useMemo(() => {
    if (view === "day") {
      const day = startOfDay(anchorDate);
      return {
        start: toDateOnly(day),
        end: toDateOnly(day),
        label: formatLongDate(day),
      };
    }
    if (view === "week") {
      const weekStart = startOfWeek(anchorDate);
      const weekEnd = addDays(weekStart, 6);
      return {
        start: toDateOnly(weekStart),
        end: toDateOnly(weekEnd),
        label: `${formatShortDate(weekStart)} – ${formatShortDate(weekEnd)}`,
      };
    }
    if (view === "agenda") {
      const today = startOfDay(new Date());
      return {
        start: toDateOnly(today),
        end: toDateOnly(addDays(today, AGENDA_RANGE_DAYS)),
        label: "Next 45 days",
      };
    }
    const grid = getMonthGrid(anchorDate);
    return {
      start: toDateOnly(grid[0]),
      end: toDateOnly(grid[41]),
      label: formatMonthYear(anchorDate),
    };
  }, [view, anchorDate]);

  const query = useCalendarEvents(range.start, range.end);

  const allEvents = useMemo(
    () => query.data?.events ?? EMPTY_EVENTS,
    [query.data],
  );
  const filteredEvents = useMemo(
    () =>
      hasActiveCalendarFilters(filters)
        ? allEvents.filter((event) => matchesEventFilters(event, filters))
        : allEvents,
    [allEvents, filters],
  );
  const eventsByDay = useMemo(
    () => groupEventsByDay(filteredEvents),
    [filteredEvents],
  );

  const goToToday = useCallback(() => {
    setAnchorDate(startOfDay(new Date()));
    setSelectedDate(new Date());
    setFocusedKey(dateKey(new Date()));
  }, []);

  const navigate = useCallback(
    (direction: "prev" | "next") => {
      setAnchorDate((current) => {
        if (view === "month")
          return addMonths(current, direction === "next" ? 1 : -1);
        if (view === "day")
          return addDays(current, direction === "next" ? 1 : -1);
        return addDays(current, direction === "next" ? 7 : -7);
      });
    },
    [view],
  );

  const handleSelectTask = useCallback(
    (event: CalendarEvent) => setSelectedEvent(event),
    [],
  );
  const handleSelectDate = useCallback(
    (date: Date) => setSelectedDate(date),
    [],
  );
  const handleOpenDay = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      setAnchorDate(startOfDay(date));
      setView("day");
    },
    [setView],
  );

  const handleToggleComplete = useCallback(
    (event: CalendarEvent) => {
      const isCompleted = event.status === "COMPLETED";
      updateTask.mutate(
        {
          id: event.taskId,
          input: { status: isCompleted ? "TODO" : "COMPLETED" },
        },
        {
          onSuccess: () =>
            notify.success(
              isCompleted ? "Task marked as todo" : "Task completed",
            ),
          onError: (error) =>
            notify.error("Unable to update status", error.message),
        },
      );
    },
    [updateTask],
  );

  const handleFiltersChange = useCallback(
    (nextFilters: CalendarFilters) => setFilters(nextFilters),
    [],
  );

  const handleReschedule = useCallback(
    (result: CalendarDropResult) => {
      const previous = {
        dueDate: result.event.start,
        estimatedMinutes: result.event.allDay
          ? null
          : Math.max(
              (new Date(result.event.end).getTime() -
                new Date(result.event.start).getTime()) /
                60_000,
              30,
            ),
      };

      reschedule.mutate(
        {
          taskId: result.taskId,
          dueDate: result.dueDate,
          ...(result.estimatedMinutes !== undefined && {
            estimatedMinutes: result.estimatedMinutes,
          }),
          previous,
        },
        {
          onSuccess: () => {
            evaluateSuggestion({
              taskId: result.taskId,
              title: result.event.title,
              dueDate: result.dueDate,
              estimatedMinutes: result.estimatedMinutes,
            });
          },
        },
      );
    },
    [reschedule, evaluateSuggestion],
  );

  const handleAcceptSuggestion = useCallback(() => {
    if (!suggestion?.suggestedDate) return;
    const date = new Date(`${suggestion.suggestedDate}T00:00:00`);
    reschedule.mutate({
      taskId: suggestion.taskId,
      dueDate: date.toISOString(),
      estimatedMinutes: null,
    });
    dismissSuggestion();
  }, [reschedule, suggestion, dismissSuggestion]);

  const selectedTask = useMemo(
    () => (selectedEvent ? eventToTask(selectedEvent) : null),
    [selectedEvent],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      )
        return;

      // Let the drag-and-drop keyboard sensor handle keys while dragging.
      if (event.defaultPrevented) return;

      if (event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (event.key === "Escape") {
        if (selectedEvent) {
          setSelectedEvent(null);
          return;
        }
        setFocusedKey(null);
        return;
      }

      if (view !== "month") return;

      const base = focusedKey
        ? new Date(`${focusedKey}T00:00:00`)
        : startOfDay(selectedDate);

      switch (event.key) {
        case "Enter":
          event.preventDefault();
          handleOpenDay(base);
          return;
        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowUp":
        case "ArrowDown": {
          const step =
            event.key === "ArrowLeft"
              ? -1
              : event.key === "ArrowRight"
                ? 1
                : event.key === "ArrowUp"
                  ? -7
                  : 7;
          event.preventDefault();
          const next = addDays(base, step);
          setSelectedDate(next);
          setFocusedKey(dateKey(next));
          return;
        }
        default:
          return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [view, selectedEvent, selectedDate, focusedKey, handleOpenDay]);

  const hasFilters = hasActiveCalendarFilters(filters);
  const canNavigate = view !== "agenda";

  const viewContent = useMemo(() => {
    if (query.isLoading) return <CalendarSkeleton view={view} />;
    if (query.isError) {
      return (
        <CalendarErrorState
          message={query.error.message}
          onRetry={() => void query.refetch()}
        />
      );
    }
    if (filteredEvents.length === 0) {
      return (
        <CalendarEmptyState
          hasFilters={hasFilters}
          onClearFilters={() =>
            setFilters({ search: "", status: "ALL", priority: "ALL" })
          }
        />
      );
    }

    switch (view) {
      case "month":
        return (
          <MonthView
            anchorDate={anchorDate}
            eventsByDay={eventsByDay}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onOpenDay={handleOpenDay}
            onSelectTask={handleSelectTask}
          />
        );
      case "week":
        return (
          <WeekView
            anchorDate={anchorDate}
            eventsByDay={eventsByDay}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onSelectTask={handleSelectTask}
          />
        );
      case "day":
        return (
          <DayView
            anchorDate={anchorDate}
            eventsByDay={eventsByDay}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onSelectTask={handleSelectTask}
          />
        );
      case "agenda":
        return (
          <AgendaView
            events={filteredEvents}
            onSelectTask={handleSelectTask}
            onToggleComplete={handleToggleComplete}
          />
        );
    }
  }, [
    query,
    view,
    anchorDate,
    eventsByDay,
    selectedDate,
    filteredEvents,
    hasFilters,
    handleSelectDate,
    handleOpenDay,
    handleSelectTask,
    handleToggleComplete,
  ]);

  return (
    <div className="space-y-4">
      <CalendarPageHeader
        periodLabel={range.label}
        onToday={goToToday}
        onCreateTask={() => setCreateOpen(true)}
      />

      <CalendarToolbar
        view={view}
        onViewChange={setView}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        canNavigate={canNavigate}
        onNavigate={navigate}
        onToday={goToToday}
        searchInputRef={searchInputRef}
      />

      <CalendarLegend />

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={`${view}-${range.start}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="relative overflow-x-auto pb-2"
        >
          <CalendarDndRoot onReschedule={handleReschedule}>
            {viewContent}
          </CalendarDndRoot>
          <div className="pointer-events-none absolute right-2 top-2 z-40">
            <RescheduleSuggestionPanel
              status={suggestionStatus}
              suggestion={suggestion}
              onAccept={handleAcceptSuggestion}
              onDismiss={dismissSuggestion}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />

      <TaskDetailsDrawer
        task={selectedTask}
        open={!!selectedEvent}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
      />
    </div>
  );
}

export default CalendarWorkspace;
