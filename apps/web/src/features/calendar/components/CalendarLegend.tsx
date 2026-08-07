import { LEGEND_ITEMS } from "../calendar.types";
import { cn } from "@/shared/lib/cn";

export function CalendarLegend() {
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1"
      aria-label="Calendar color legend"
    >
      {LEGEND_ITEMS.map((item) => (
        <span
          key={item.label}
          className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"
        >
          <span
            className={cn("size-2 rounded-full", item.dot)}
            aria-hidden="true"
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export default CalendarLegend;
