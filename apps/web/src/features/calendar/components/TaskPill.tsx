import { forwardRef, memo } from "react";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { CircleCheckBig } from "lucide-react";

import type { CalendarEvent } from "../calendar.types";
import { getEventStyle } from "../calendar.utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import EventTooltipContent from "./EventTooltipContent";
import { cn } from "@/shared/lib/cn";

export interface TaskPillProps {
  event: CalendarEvent;
  onSelect: (event: CalendarEvent) => void;
  className?: string;
  style?: CSSProperties;
}

export const TaskPill = memo(
  forwardRef<HTMLButtonElement, TaskPillProps>(function TaskPill(
    { event, onSelect, className, style, ...rest },
    ref,
  ) {
    const pillStyle = getEventStyle(event);
    const isCompleted = event.status === "COMPLETED";

    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <motion.button
            ref={ref}
            type="button"
            whileHover={{ y: -1 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(event);
            }}
            style={style}
            className={cn(
              "flex w-full items-center gap-1.5 rounded-md border px-1.5 py-[3px] text-left text-[11px] font-medium shadow-xs transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              pillStyle.pill,
              className,
            )}
            aria-label={`${event.title}, ${pillStyle.label}`}
            {...rest}
          >
            <span
              className={cn("size-1.5 shrink-0 rounded-full", pillStyle.dot)}
              aria-hidden="true"
            />
            <span
              className={cn(
                "min-w-0 flex-1 truncate",
                isCompleted && "line-through opacity-70",
              )}
            >
              {event.title}
            </span>
            {isCompleted && (
              <CircleCheckBig className="size-3 shrink-0" aria-hidden="true" />
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={6}
          className="w-72 max-w-sm flex-col items-start gap-0 rounded-lg px-3.5 py-3"
        >
          <EventTooltipContent event={event} />
        </TooltipContent>
      </Tooltip>
    );
  }),
);

export default TaskPill;
