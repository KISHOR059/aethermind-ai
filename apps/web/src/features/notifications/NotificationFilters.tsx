import { FilterX } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/components/ui/button";
import { NOTIFICATION_TYPES, type NotificationTypeFilter } from "./notification.types";

export type NotificationReadFilter = "ALL" | "UNREAD" | "READ";

type NotificationFiltersProps = {
  typeFilter: NotificationTypeFilter;
  onTypeChange: (type: NotificationTypeFilter) => void;
  readFilter: NotificationReadFilter;
  onReadChange: (filter: NotificationReadFilter) => void;
  onClear: () => void;
};

const READ_OPTIONS: Array<{ value: NotificationReadFilter; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "UNREAD", label: "Unread" },
  { value: "READ", label: "Read" },
];

export function NotificationFilters({
  typeFilter,
  onTypeChange,
  readFilter,
  onReadChange,
  onClear,
}: NotificationFiltersProps) {
  const hasActiveFilters = typeFilter !== "ALL" || readFilter !== "ALL";

  return (
    <div className="space-y-2 border-b border-border px-4 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <FilterChip
          label="All"
          active={typeFilter === "ALL"}
          onClick={() => onTypeChange("ALL")}
        />
        {NOTIFICATION_TYPES.map((type) => (
          <FilterChip
            key={type}
            label={type.charAt(0) + type.slice(1).toLowerCase()}
            active={typeFilter === type}
            onClick={() => onTypeChange(type)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {READ_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={readFilter === option.value}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                readFilter === option.value
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => onReadChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={onClear}
          >
            <FilterX className="size-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

type FilterChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground",
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
