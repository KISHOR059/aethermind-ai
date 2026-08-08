import type { RefObject } from "react";
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  ListTodo,
  Search,
  X,
} from "lucide-react";

import type {
  CalendarFilters,
  CalendarPriorityFilter,
  CalendarStatusFilter,
  CalendarView,
} from "../calendar.types";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { cn } from "@/shared/lib/cn";

const VIEW_OPTIONS: Array<{
  value: CalendarView;
  label: string;
  icon: typeof CalendarDays;
}> = [
  { value: "month", label: "Month", icon: CalendarDays },
  { value: "week", label: "Week", icon: Calendar },
  { value: "day", label: "Day", icon: Clock3 },
  { value: "agenda", label: "Agenda", icon: ListTodo },
];

export interface CalendarToolbarProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  filters: CalendarFilters;
  onFiltersChange: (filters: CalendarFilters) => void;
  canNavigate: boolean;
  onNavigate: (direction: "prev" | "next") => void;
  onToday: () => void;
  periodLabel: string;
  searchInputRef: RefObject<HTMLInputElement | null>;
}

export function CalendarToolbar({
  view,
  onViewChange,
  filters,
  onFiltersChange,
  canNavigate,
  onNavigate,
  onToday,
  periodLabel,
  searchInputRef,
}: CalendarToolbarProps) {
  const activeFilterCount =
    (filters.status !== "ALL" ? 1 : 0) + (filters.priority !== "ALL" ? 1 : 0);

  const updateFilters = (patch: Partial<CalendarFilters>) =>
    onFiltersChange({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Period navigation */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onNavigate("prev")}
          disabled={!canNavigate}
          aria-label="Previous period"
          title={
            canNavigate
              ? "Previous period"
              : "Navigation is disabled in agenda view"
          }
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onNavigate("next")}
          disabled={!canNavigate}
          aria-label="Next period"
          title={
            canNavigate
              ? "Next period"
              : "Navigation is disabled in agenda view"
          }
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="ml-1 text-xs font-semibold"
        >
          Today
        </Button>
      </div>

      {/* Current period label */}
      <span className="hidden text-sm font-bold tracking-tight text-primary lg:inline">
        {periodLabel}
      </span>

      {/* View switcher */}
      <div
        role="tablist"
        aria-label="Calendar view"
        className="inline-flex items-center rounded-xl border border-border/60 bg-card/80 p-0.5"
      >
        {VIEW_OPTIONS.map(({ value, label, icon: Icon }) => {
          const active = view === value;
          return (
            <button
              key={value}
              role="tab"
              aria-selected={active}
              onClick={() => onViewChange(value)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Search + filter */}
      <div className="ml-auto flex flex-1 items-center justify-end gap-2 sm:flex-none">
        <div className="relative w-full min-w-[160px] max-w-[240px]">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            ref={searchInputRef}
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            placeholder="Search tasks… (/)"
            aria-label="Search calendar tasks"
            className="h-9 bg-card/80 pl-9 pr-8 text-xs rounded-xl border-border/60"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => updateFilters({ search: "" })}
              aria-label="Clear search"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="relative gap-1.5 text-xs font-semibold"
            >
              <Filter className="size-3.5" aria-hidden="true" />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={filters.status}
              onValueChange={(value) =>
                updateFilters({ status: value as CalendarStatusFilter })
              }
            >
              <DropdownMenuRadioItem value="ALL">
                All statuses
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="PENDING">
                Pending
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="COMPLETED">
                Completed
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="OVERDUE">
                Overdue
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Priority</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={filters.priority}
              onValueChange={(value) =>
                updateFilters({ priority: value as CalendarPriorityFilter })
              }
            >
              <DropdownMenuRadioItem value="ALL">
                All priorities
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="HIGH">
                High priority
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="MEDIUM">
                Medium priority
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="LOW">
                Low priority
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            {activeFilterCount > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() =>
                    updateFilters({ status: "ALL", priority: "ALL" })
                  }
                  className="text-destructive focus:text-destructive"
                >
                  Clear filters
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default CalendarToolbar;
