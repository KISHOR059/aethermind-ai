import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardCode,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { motion } from "framer-motion";

import type { CalendarEvent } from "../calendar.types";
import {
  formatTime,
  getEventStyle,
  HOUR_END,
  HOUR_START,
} from "../calendar.utils";
import {
  DND,
  parseDropId,
  type DropTargetKind,
  type TaskDragData,
  type TimeGridHover,
} from "./dnd.types";
import { createCalendarKeyboardCoordinates } from "./calendar-dnd-keyboard";
import { CalendarDndContext } from "./calendar-dnd-context";
import { cn } from "@/shared/lib/cn";

const TOTAL_MINUTES = (HOUR_END - HOUR_START) * 60;
const SNAP_MINUTES = 30;
const DEFAULT_DURATION_MINUTES = 60;

export type CalendarDropResult = {
  event: CalendarEvent;
  taskId: string;
  dueDate: string;
  estimatedMinutes?: number | null;
};

export type CalendarDndRootProps = {
  onReschedule: (result: CalendarDropResult) => void;
  children: ReactNode;
};

function snapToSlot(rawMinutes: number, maxMinutes = HOUR_END * 60): number {
  const snapped = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES;
  return Math.min(Math.max(snapped, HOUR_START * 60), maxMinutes - SNAP_MINUTES);
}

function minutesFromPointer(
  clientY: number,
  rectTop: number,
  rectHeight: number,
): number {
  const ratio = Math.min(Math.max((clientY - rectTop) / rectHeight, 0), 1);
  return snapToSlot(HOUR_START * 60 + ratio * TOTAL_MINUTES);
}

function eventDurationMinutes(event: CalendarEvent): number {
  if (event.allDay) return DEFAULT_DURATION_MINUTES;
  return Math.max(
    (new Date(event.end).getTime() - new Date(event.start).getTime()) / 60_000,
    SNAP_MINUTES,
  );
}

function resolveDropPayload(
  event: CalendarEvent,
  target: { kind: DropTargetKind; dateKey: string },
  dragEvent: DragEndEvent,
  pointer: { x: number; y: number } | null,
): { dueDate: string; estimatedMinutes?: number | null } {
  const day = new Date(`${target.dateKey}T00:00:00`);
  const originalStart = new Date(event.start);

  switch (target.kind) {
    case "allDay": {
      day.setHours(0, 0, 0, 0);
      return { dueDate: day.toISOString(), estimatedMinutes: null };
    }
    case "day": {
      if (!event.allDay) {
        day.setHours(
          originalStart.getHours(),
          originalStart.getMinutes(),
          0,
          0,
        );
      }
      return { dueDate: day.toISOString() };
    }
    case "time": {
      const rect = dragEvent.over?.rect;
      const minutes = pointer && rect
        ? minutesFromPointer(pointer.y, rect.top, rect.height)
        : snapToSlot(
            originalStart.getHours() * 60 +
              originalStart.getMinutes() +
              Math.round(
                dragEvent.delta.y /
                  (rect?.height ?? 1) /
                  (HOUR_END - HOUR_START) *
                  TOTAL_MINUTES,
              ),
          );
      day.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      return {
        dueDate: day.toISOString(),
        estimatedMinutes: event.allDay ? DEFAULT_DURATION_MINUTES : undefined,
      };
    }
  }
}

function DragPreview({ event }: { event: CalendarEvent }) {
  const style = getEventStyle(event);
  const start = new Date(event.start);

  return (
    <motion.div
      initial={{ scale: 1, opacity: 0.95 }}
      animate={{ scale: 1.05, opacity: 0.95, rotate: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "pointer-events-none flex w-52 items-center gap-1.5 rounded-md border px-2 py-1.5 text-left text-xs font-medium shadow-lg",
        style.pill,
      )}
    >
      <span
        className={cn("size-2 shrink-0 rounded-full", style.dot)}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 truncate">{event.title}</span>
      {!event.allDay && (
        <span className="shrink-0 text-[10px] opacity-75">
          {formatTime(start)}
        </span>
      )}
    </motion.div>
  );
}

export function CalendarDndRoot({
  onReschedule,
  children,
}: CalendarDndRootProps) {
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
  const [hoveredTime, setHoveredTime] = useState<TimeGridHover | null>(null);

  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const onRescheduleRef = useRef(onReschedule);

  useEffect(() => {
    onRescheduleRef.current = onReschedule;
  });

  useEffect(() => {
    if (!activeEvent) return;
    const onPointerMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [activeEvent]);

  const coordinateGetter = useMemo(
    () => createCalendarKeyboardCoordinates(),
    [],
  );

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter,
      // Space starts/ends the drag so Enter still opens task details.
      keyboardCodes: {
        start: [KeyboardCode.Space],
        cancel: [KeyboardCode.Esc],
        end: [KeyboardCode.Space],
      },
    }),
  );

  const announcements = useMemo<Announcements>(
    () => ({
      onDragStart({ active }) {
        const data = active.data.current as TaskDragData | undefined;
        if (!data || data.type !== DND.TASK) return "Picked up a task.";
        return `Picked up ${data.event.title}. Press the arrow keys to move it, then press Space to drop it or Escape to cancel.`;
      },
      onDragOver({ active, over }) {
        const data = active.data.current as TaskDragData | undefined;
        if (!data || data.type !== DND.TASK || !over) return undefined;
        const parsed = parseDropId(String(over.id));
        if (!parsed) return undefined;
        const label = new Date(`${parsed.dateKey}T00:00:00`).toLocaleDateString(
          undefined,
          { weekday: "long", month: "short", day: "numeric" },
        );
        return `${data.event.title} is over ${label}.`;
      },
      onDragEnd({ active, over }) {
        const data = active.data.current as TaskDragData | undefined;
        if (!data || data.type !== DND.TASK) return undefined;
        if (!over) return `${data.event.title} was dropped back in its original position.`;
        return `${data.event.title} was dropped and rescheduled.`;
      },
      onDragCancel({ active }) {
        const data = active.data.current as TaskDragData | undefined;
        if (!data || data.type !== DND.TASK) return undefined;
        return `Dragging cancelled. ${data.event.title} stays in its original position.`;
      },
    }),
    [],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as TaskDragData | undefined;
    if (!data || data.type !== DND.TASK) return;
    pointerRef.current = null;
    setHoveredTime(null);
    setActiveEvent(data.event);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const over = event.over;
    if (!over) {
      setHoveredTime(null);
      return;
    }

    const parsed = parseDropId(String(over.id));
    if (!parsed) return;

    if (parsed.kind === "time") {
      const pointer = pointerRef.current;
      if (pointer && over.rect) {
        setHoveredTime({
          containerId: String(over.id),
          minutes: minutesFromPointer(pointer.y, over.rect.top, over.rect.height),
        });
      }
    } else {
      setHoveredTime(null);
    }
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveEvent(null);
    setHoveredTime(null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const data = event.active.data.current as TaskDragData | undefined;
      const over = event.over;

      setActiveEvent(null);
      setHoveredTime(null);

      if (!data || data.type !== DND.TASK || !over) return;

      const parsed = parseDropId(String(over.id));
      if (!parsed) return;

      const drop = resolveDropPayload(
        data.event,
        parsed,
        event,
        pointerRef.current,
      );

      const originalStart = new Date(data.event.start);
      const isSameSlot =
        new Date(drop.dueDate).getTime() === originalStart.getTime();
      const sameDuration =
        (drop.estimatedMinutes === undefined &&
          !data.event.allDay) ||
        (drop.estimatedMinutes === null && data.event.allDay) ||
        (typeof drop.estimatedMinutes === "number" &&
          !data.event.allDay &&
          drop.estimatedMinutes === eventDurationMinutes(data.event));

      if (isSameSlot && sameDuration) return;

      onRescheduleRef.current?.({
        event: data.event,
        taskId: data.event.taskId,
        dueDate: drop.dueDate,
        estimatedMinutes: drop.estimatedMinutes,
      });
    },
    [],
  );

  const contextValue = useMemo(
    () => ({ activeEvent, hoveredTime }),
    [activeEvent, hoveredTime],
  );

  return (
    <CalendarDndContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        accessibility={{ announcements }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}
        <DragOverlay
          dropAnimation={{ duration: 200, easing: "ease-out" }}
          className="cursor-grabbing"
        >
          {activeEvent ? <DragPreview event={activeEvent} /> : null}
        </DragOverlay>
      </DndContext>
    </CalendarDndContext.Provider>
  );
}

export default CalendarDndRoot;
