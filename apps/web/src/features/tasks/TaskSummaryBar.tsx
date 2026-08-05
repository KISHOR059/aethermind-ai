import {
  CircleCheckBig,
  ClipboardList,
  Clock3,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";

import { Skeleton } from "@/shared/components/ui/skeleton";
import type { TaskStatusFilter } from "./task.types";

export interface TaskSummaryBarProps {
  counts: {
    total: number;
    todo: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  activeStatusFilter?: TaskStatusFilter;
  onStatusSelect: (status: TaskStatusFilter) => void;
  isLoading?: boolean;
}

export function TaskSummaryBar({
  counts,
  activeStatusFilter = "ALL",
  onStatusSelect,
  isLoading = false,
}: TaskSummaryBarProps) {
  const items = [
    {
      id: "ALL" as const,
      label: "Total Tasks",
      count: counts.total,
      icon: ClipboardList,
      color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    },
    {
      id: "TODO" as const,
      label: "Todo",
      count: counts.todo,
      icon: Clock3,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    {
      id: "IN_PROGRESS" as const,
      label: "In Progress",
      count: counts.inProgress,
      icon: LoaderCircle,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    {
      id: "COMPLETED" as const,
      label: "Completed",
      count: counts.completed,
      icon: CircleCheckBig,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    {
      id: "OVERDUE" as const,
      label: "Overdue",
      count: counts.overdue,
      icon: TriangleAlert,
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeStatusFilter === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onStatusSelect(item.id)}
            className={`group flex items-center justify-between rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 shadow-2xs ${
              isActive
                ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                : "border-border/60 bg-card/80 backdrop-blur-md hover:border-border"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`size-8 rounded-lg flex items-center justify-center border ${item.color} group-hover:scale-105 transition-transform`}
              >
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {item.label}
                </p>
                <p className="text-lg font-extrabold tracking-tight text-foreground">
                  {isLoading ? (
                    <Skeleton className="h-7 w-14 rounded-full" />
                  ) : (
                    item.count
                  )}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default TaskSummaryBar;
