import {
  CalendarCheck,
  CheckCircle2,
  CircleDashed,
  Flame,
  Zap,
} from "lucide-react";

import type { DashboardStatistics } from "./dashboard.types";
import { Card, CardContent } from "@/shared/components/ui/card";

export interface DashboardCardsProps {
  stats: DashboardStatistics;
}

export function DashboardCards({ stats }: DashboardCardsProps) {
  const activeCount = stats.pendingTasks + stats.inProgressTasks;

  return (
    <div className="grid gap-2 sm:gap-2.5 grid-cols-2 lg:grid-cols-4">
      {/* 1. Today's Tasks */}
      <Card className="rounded-lg border-border/60 bg-card shadow-2xs hover:border-border transition-colors">
        <CardContent className="p-2.5 sm:p-3.5 flex flex-col justify-between space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Today's Tasks
            </span>
            <div className="size-6 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <CalendarCheck className="size-3" />
            </div>
          </div>

          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {stats.tasksDueToday}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 font-medium">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {stats.tasksFinishedToday}
              </span>
              completed today
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Completed Tasks */}
      <Card className="rounded-lg border-border/60 bg-card shadow-2xs hover:border-border transition-colors">
        <CardContent className="p-2.5 sm:p-3.5 flex flex-col justify-between space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Completed Tasks
            </span>
            <div className="size-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="size-3" />
            </div>
          </div>

          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {stats.completedTasks}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 font-medium">
              <span className="text-foreground font-semibold">{stats.completionRate}%</span>
              completion rate
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Active Queue */}
      <Card className="rounded-lg border-border/60 bg-card shadow-2xs hover:border-border transition-colors">
        <CardContent className="p-2.5 sm:p-3.5 flex flex-col justify-between space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Active Queue
            </span>
            <div className="size-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500">
              <CircleDashed className="size-3" />
            </div>
          </div>

          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {activeCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 font-medium">
              {stats.overdueTasks > 0 ? (
                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                  {stats.overdueTasks} overdue
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  All on schedule
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Productivity Score */}
      <Card className="rounded-lg border-border/60 bg-card shadow-2xs hover:border-border transition-colors">
        <CardContent className="p-2.5 sm:p-3.5 flex flex-col justify-between space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Productivity
            </span>
            <div className="size-6 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Zap className="size-3" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {stats.productivityScore}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">/ 100</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 font-medium">
              <Flame className="size-3 text-orange-500 fill-orange-500" />
              <span className="text-foreground font-semibold">{stats.currentStreak}</span>
              day streak
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardCards;
