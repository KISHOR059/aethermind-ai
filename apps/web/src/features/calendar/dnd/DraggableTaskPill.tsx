import { memo } from "react";
import type { CSSProperties } from "react";
import { useDraggable } from "@dnd-kit/core";

import type { CalendarEvent } from "../calendar.types";
import { DND, type TaskDragData } from "./dnd.types";
import TaskPill from "../components/TaskPill";

export interface DraggableTaskPillProps {
  event: CalendarEvent;
  onSelect: (event: CalendarEvent) => void;
  className?: string;
}

export const DraggableTaskPill = memo(function DraggableTaskPill({
  event,
  onSelect,
  className,
}: DraggableTaskPillProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.taskId,
    data: { type: DND.TASK, event } satisfies TaskDragData,
  });

  const style: CSSProperties = {
    touchAction: "none",
    opacity: isDragging ? 0.35 : undefined,
    cursor: isDragging ? "grabbing" : "grab",
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <TaskPill
      ref={setNodeRef}
      event={event}
      onSelect={(selected) => {
        if (!isDragging) onSelect(selected);
      }}
      className={className}
      style={style}
      {...attributes}
      {...listeners}
    />
  );
});

export default DraggableTaskPill;
