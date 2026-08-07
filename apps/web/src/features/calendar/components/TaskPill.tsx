import { memo } from "react";
import { motion } from "framer-motion";
import { CircleCheckBig } from "lucide-react";

import type { CalendarEvent } from "../calendar.types";
import { getEventStyle } from "../calendar.utils";
import { cn } from "@/shared/lib/cn";

export interface TaskPillProps {
  event: CalendarEvent;
  onSelect: (event: CalendarEvent) => void;
  className?: string;
}

export const TaskPill = memo(function TaskPill({
  event,
  onSelect,
  className,
}: TaskPillProps) {
  const style = getEventStyle(event);
  const isCompleted = event.status === "COMPLETED";

  return (
    <motion.button
      type="button"
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(event);
      }}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-md border px-1.5 py-[3px] text-left text-[11px] font-medium shadow-xs transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        style.pill,
        className,
      )}
      aria-label={`${event.title}, ${style.label}`}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", style.dot)}
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
  );
});

export default TaskPill;
