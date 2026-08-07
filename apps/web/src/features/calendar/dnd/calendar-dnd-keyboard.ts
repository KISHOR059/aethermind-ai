import type { KeyboardCoordinateGetter } from "@dnd-kit/core";

import { HOUR_END, HOUR_START, addDays } from "../calendar.utils";
import type { ActiveDrop } from "./dnd.types";
import {
  allDayDropId,
  dayDropId,
  parseDropId,
  timeDropId,
} from "./dnd.types";

/**
 * Custom keyboard coordinate getter for grid-based calendar dragging.
 *
 * Month view: Arrow keys move one day (left/right) or one week (up/down)
 * between day-cell drop targets.
 *
 * Week/Day view: left/right moves between day columns, up/down moves
 * vertically in hourly steps (the drop time follows the translated position).
 *
 * All-day strip targets behave like day targets for keyboard navigation.
 *
 * The current drop target is read from the sensor context (`over`) so no
 * component refs are required. Deltas are computed from the droppable rects
 * so movement is exact.
 */
export function createCalendarKeyboardCoordinates(): KeyboardCoordinateGetter {
  return (event, { context }) => {
    const over = context.over;
    if (!over) return undefined;

    const parsed = parseDropId(String(over.id));
    if (!parsed) return undefined;

    const current: ActiveDrop = {
      containerId: String(over.id),
      type: parsed.kind,
      date: new Date(`${parsed.dateKey}T00:00:00`),
    };

    const vertical = event.key === "ArrowUp" || event.key === "ArrowDown";
    const horizontal = event.key === "ArrowLeft" || event.key === "ArrowRight";
    if (!vertical && !horizontal) return undefined;

    const rects = context.droppableRects;
    const from = rects.get(current.containerId);
    if (!from) return undefined;

    const isDayLike = current.type === "day" || current.type === "allDay";

    if (isDayLike) {
      const step = horizontal
        ? event.key === "ArrowLeft"
          ? -1
          : 1
        : event.key === "ArrowUp"
          ? -7
          : 7;
      const nextDate = addDays(current.date, step);
      const nextId =
        current.type === "allDay"
          ? allDayDropId(nextDate)
          : dayDropId(nextDate);
      const to = rects.get(nextId);
      if (!to) return undefined;
      return { x: to.left - from.left, y: to.top - from.top };
    }

    if (horizontal) {
      const nextId = timeDropId(
        addDays(current.date, event.key === "ArrowLeft" ? -1 : 1),
      );
      const to = rects.get(nextId);
      const x = to
        ? to.left - from.left
        : event.key === "ArrowLeft"
          ? -from.width
          : from.width;
      return { x, y: 0 };
    }

    const hourStep = from.height / (HOUR_END - HOUR_START);
    return {
      x: 0,
      y: event.key === "ArrowUp" ? -hourStep : hourStep,
    };
  };
}
