import { memo } from "react";
import type { CSSProperties } from "react";
import { useDraggable } from "@dnd-kit/core";

import type { CalendarEvent } from "../calendar.types";
import { DND, type TaskDragData } from "./dnd.types";
import { TimelineEventBlock } from "../components/TimelineGrid";

export interface DraggableTimelineBlockProps {
  event: CalendarEvent;
  onSelect: (event: CalendarEvent) => void;
}

export const DraggableTimelineBlock = memo(function DraggableTimelineBlock({
  event,
  onSelect,
}: DraggableTimelineBlockProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.taskId,
    data: { type: DND.TASK, event } satisfies TaskDragData,
  });

  const style: CSSProperties = {
    touchAction: "none",
    opacity: isDragging ? 0.35 : undefined,
    cursor: isDragging ? "grabbing" : "grab",
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <TimelineEventBlock
      ref={setNodeRef}
      event={event}
      onSelect={(selected) => {
        if (!isDragging) onSelect(selected);
      }}
      style={style}
      {...attributes}
      {...listeners}
    />
  );
});

export default DraggableTimelineBlock;
