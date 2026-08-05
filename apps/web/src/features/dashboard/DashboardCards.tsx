import {
  AlertCircle,
  Brain,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Flame,
  Hourglass,
  LayoutDashboard,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
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
  const scoreBadge =
    stats.productivityScore >= 80 ? (
      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1 font-semibold">
        <Zap className="size-3 text-amber-500 fill-amber-500" /> Peak Focus
      </Badge>
    ) : stats.productivityScore >= 60 ? (
      <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 gap-1 font-semibold">
        <TrendingUp className="size-3 text-blue-500" /> Good Momentum
      </Badge>
    ) : (
      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 gap-1 font-semibold">
        <Sparkles className="size-3 text-primary" /> Building Habits
      </Badge>
    );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {/* 1. Total Tasks */}
      <Card className="relative overflow-hidden rounded-xl border-border/60 bg-card hover:border-primary/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Tasks
          </CardTitle>
          <div className="size-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <LayoutDashboard className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-extrabold tracking-tight text-foreground">
            {stats.totalTasks}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <Sparkles className="size-3 text-blue-500" />
            {stats.tasksDueThisWeek} due this week
          </p>
        </CardContent>
      </Card>

      {/* 2. Completed Tasks */}
      <Card className="relative overflow-hidden rounded-xl border-border/60 bg-card hover:border-emerald-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Completed
          </CardTitle>
          <div className="size-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
            {stats.completedTasks}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <TrendingUp className="size-3 text-emerald-500" />
            {stats.tasksFinishedToday} finished today
          </p>
        </CardContent>
      </Card>

      {/* 3. Pending Tasks */}
      <Card className="relative overflow-hidden rounded-xl border-border/60 bg-card hover:border-amber-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Pending
          </CardTitle>
          <div className="size-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <CircleDashed className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
            {stats.pendingTasks}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <Clock3 className="size-3 text-amber-500" />
            {stats.tasksDueToday} due today
          </p>
        </CardContent>
      </Card>

      {/* 4. In Progress */}
      <Card className="relative overflow-hidden rounded-xl border-border/60 bg-card hover:border-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            In Progress
          </CardTitle>
          <div className="size-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Hourglass className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
            {stats.inProgressTasks}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <Brain className="size-3 text-indigo-500" />
            Active focus queue
          </p>
        </CardContent>
      </Card>

      {/* 5. Overdue Tasks */}
      <Card className="relative overflow-hidden rounded-xl border-border/60 bg-card hover:border-rose-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Overdue
          </CardTitle>
          <div className="size-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
            <TriangleAlert className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
            {stats.overdueTasks}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <AlertCircle className="size-3 text-rose-500" />
            {stats.overdueTasks > 0 ? "Action required" : "Clean queue!"}
          </p>
        </CardContent>
      </Card>

      {/* 6. Completion Rate */}
      <Card className="relative overflow-hidden rounded-xl border-border/60 bg-card hover:border-cyan-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Completion Rate
          </CardTitle>
          <div className="size-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500">
            <Target className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <p className="text-3xl font-extrabold tracking-tight text-foreground">
            {stats.completionRate}%
          </p>
          <Progress value={stats.completionRate} className="h-1.5 bg-muted" />
        </CardContent>
      </Card>

      {/* 7. Productivity Score */}
      <Card className="relative overflow-hidden rounded-xl border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card hover:border-primary/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Productivity Score
          </CardTitle>
          <Zap className="size-4 text-amber-500 fill-amber-500 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-extrabold tracking-tight text-primary">
              {stats.productivityScore}
            </p>
            <span className="text-[10px] font-semibold text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            {scoreBadge}
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 font-medium">
              <Flame className="size-3 text-orange-500 fill-orange-500" />
              {stats.currentStreak}d streak
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardCards;
