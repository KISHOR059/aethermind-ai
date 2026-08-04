import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Flame,
  Hourglass,
  Percent,
  Zap,
} from "lucide-react";

import type { DashboardStatistics } from "./dashboard.types";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";

export interface DashboardCardsProps {
  stats: DashboardStatistics;
}

export function DashboardCards({ stats }: DashboardCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
      {/* 1. Productivity Score */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Score
          </CardTitle>
          <Zap className="size-4 text-amber-500 fill-amber-500 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-primary">
              {stats.productivityScore}
            </p>
            <span className="text-[10px] text-muted-foreground">/ 100</span>
          </div>
          <Badge
            variant="outline"
            className="mt-1.5 text-[10px] bg-primary/10 text-primary border-primary/20"
          >
            {stats.productivityScore >= 80
              ? "⚡ Peak Focus"
              : stats.productivityScore >= 60
                ? "👍 Good Momentum"
                : "🌱 Building Habits"}
          </Badge>
        </CardContent>
      </Card>

      {/* 2. Tasks Completed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Completed
          </CardTitle>
          <CheckCircle2 className="size-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {stats.completedTasks}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Out of {stats.createdTasks} total tasks
          </p>
        </CardContent>
      </Card>

      {/* 3. Pending Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Pending
          </CardTitle>
          <Hourglass className="size-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {stats.pendingTasks}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            In queue & in progress
          </p>
        </CardContent>
      </Card>

      {/* 4. Overdue Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Overdue
          </CardTitle>
          <AlertCircle className="size-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            {stats.overdueTasks}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Requires immediate action
          </p>
        </CardContent>
      </Card>

      {/* 5. Completion Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Completion Rate
          </CardTitle>
          <Percent className="size-4 text-blue-500" />
        </CardHeader>
        <CardContent className="space-y-1.5">
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {stats.completionRate}%
          </p>
          <Progress value={stats.completionRate} className="h-1.5" />
        </CardContent>
      </Card>

      {/* 6. Current Streak */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Current Streak
          </CardTitle>
          <Flame className="size-4 text-orange-500 fill-orange-500" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
            {stats.currentStreak} <span className="text-xs font-normal">days</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Best: {stats.longestStreak} days
          </p>
        </CardContent>
      </Card>

      {/* 7. Estimated Hours Worked */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Focus Time
          </CardTitle>
          <Clock className="size-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
            {stats.estimatedHoursWorked} <span className="text-xs font-normal">hrs</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {stats.completedMinutes} total mins
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardCards;
