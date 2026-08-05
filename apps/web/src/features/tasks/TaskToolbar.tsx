import {
  ArrowUpDown,
  FilterX,
  LayoutGrid,
  LayoutList,
  Search,
  X,
} from "lucide-react";

import type { TaskPriority, TaskStatusFilter } from "./task.types";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

export interface TaskToolbarProps {
  search: string;
  onSearchChange: (search: string) => void;
  statusFilter: TaskStatusFilter;
  onStatusChange: (status: TaskStatusFilter) => void;
  priorityFilter: TaskPriority | "ALL";
  onPriorityChange: (priority: TaskPriority | "ALL") => void;
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
  viewMode: "list" | "grid";
  onViewModeChange: (mode: "list" | "grid") => void;
}

export function TaskToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
}: TaskToolbarProps) {
  const hasActiveFilters =
    search.trim() !== "" || statusFilter !== "ALL" || priorityFilter !== "ALL";

  const handleClearFilters = () => {
    onSearchChange("");
    onStatusChange("ALL");
    onPriorityChange("ALL");
  };

  return (
    <div className="sticky top-0 z-20 backdrop-blur-md bg-background/90 py-3 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
      {/* Left: Search input */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks by title or description... (Press '/')"
          className="pl-9 pr-8 h-9 text-xs rounded-xl bg-card/80 border-border/60 focus:bg-background transition-all"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Right: Filters & Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus | "ALL")}
          className="h-9 px-3 text-xs rounded-xl border border-border/60 bg-card/80 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="ALL">Status: All</option>
          <option value="TODO">Status: Todo</option>
          <option value="IN_PROGRESS">Status: In Progress</option>
          <option value="COMPLETED">Status: Completed</option>
          <option value="OVERDUE">Status: Overdue</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => onPriorityChange(e.target.value as TaskPriority | "ALL")}
          className="h-9 px-3 text-xs rounded-xl border border-border/60 bg-card/80 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="ALL">Priority: All</option>
          <option value="URGENT">Priority: Urgent</option>
          <option value="HIGH">Priority: High</option>
          <option value="MEDIUM">Priority: Medium</option>
          <option value="LOW">Priority: Low</option>
        </select>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-1">
          <ArrowUpDown className="size-3.5 text-muted-foreground hidden sm:inline-block" />
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl border border-border/60 bg-card/80 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="createdAt">Sort: Created Date</option>
            <option value="dueDate">Sort: Due Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="title">Sort: Title</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1 rounded-xl"
          >
            <FilterX className="size-3.5" />
            Clear
          </Button>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-xl border border-border/60 bg-card/80 p-0.5">
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewMode === "list"
                ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="List View"
            aria-label="List View"
          >
            <LayoutList className="size-4" />
          </button>
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewMode === "grid"
                ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Grid View"
            aria-label="Grid View"
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskToolbar;
