import { Clock3 } from "lucide-react";

import type { CalendarEvent } from "../calendar.types";
import {
  formatShortDate,
  formatTimeRange,
  getEventStyle,
} from "../calendar.utils";
import { cn } from "@/shared/lib/cn";

export function EventTooltipContent({ event }: { event: CalendarEvent }) {
  const pillStyle = getEventStyle(event);

  return (
    <div className="w-full space-y-1.5">
      <div className="flex w-full items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs font-semibold">
          {event.title}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-background/80">
          <span
            className={cn("size-1.5 rounded-full", pillStyle.dot)}
            aria-hidden="true"
          />
          {pillStyle.label}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-background/70">
        <Clock3 className="size-3 shrink-0" aria-hidden="true" />
        <span className="whitespace-nowrap">{formatTimeRange(event)}</span>
        <span aria-hidden="true">·</span>
        <span className="whitespace-nowrap">
          {formatShortDate(new Date(event.start))}
        </span>
      </div>
      {event.description && (
        <p className="line-clamp-2 text-[11px] leading-snug text-background/60">
          {event.description}
        </p>
      )}
    </div>
  );
}

export default EventTooltipContent;
