import { Link } from "react-router-dom";
import {
  AlertCircle,
  Bot,
  LineChart,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { useDashboardStats } from "@/features/dashboard/dashboard.hooks";
import DashboardCards from "@/features/dashboard/DashboardCards";
import DashboardTodayTasks from "@/features/dashboard/DashboardTodayTasks";
import DashboardUpcomingTasks from "@/features/dashboard/DashboardUpcomingTasks";
import DashboardAICard from "@/features/dashboard/DashboardAICard";
import DashboardCalendarPreview from "@/features/dashboard/DashboardCalendarPreview";
import DashboardCharts from "@/features/dashboard/DashboardCharts";
import DashboardInsights from "@/features/dashboard/DashboardInsights";
import DashboardEmptyState from "@/features/dashboard/DashboardEmptyState";
import CreateTaskDialog from "@/features/tasks/CreateTaskDialog";
import PlanMyDayDialog from "@/features/ai/PlanMyDayDialog";
import { defaultTaskParams, useTasks } from "@/features/tasks/task.hooks";
import { Alert } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/auth.context";

function getGreeting(name?: string) {
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return name ? `${timeGreeting}, ${name}` : `${timeGreeting}`;
}

function DashboardPage() {
  const { user } = useAuth();
  const statsQuery = useDashboardStats();
  const tasksQuery = useTasks({ ...defaultTaskParams, limit: 50 });

  const allTasks = tasksQuery.data?.items ?? [];

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="max-w-screen-2xl mx-auto space-y-4 pb-8">
      {/* 1. Hero & Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/40">
        <div className="space-y-0.5">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            {getGreeting(user?.firstName)}
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span>Here's your productivity overview for today.</span>
            <span className="hidden sm:inline text-border">•</span>
            <span className="hidden sm:inline font-medium text-foreground/80">{formattedDate}</span>
          </p>
        </div>

        {/* Header Action Bar */}
        <div className="flex items-center gap-1.5 shrink-0">
          <PlanMyDayDialog
            trigger={
              <Button variant="outline" size="xs" className="gap-1 text-xs font-semibold h-7">
                <Sparkles className="size-3 text-amber-500" />
                <span className="hidden sm:inline">Plan Day</span>
              </Button>
            }
          />

          <Button
            asChild
            variant="outline"
            size="xs"
            className="gap-1 text-xs font-semibold h-7"
          >
            <Link to="/assistant">
              <Bot className="size-3 text-primary" />
              <span className="hidden sm:inline">AI Assistant</span>
            </Link>
          </Button>

          <CreateTaskDialog
            trigger={
              <Button size="xs" className="gap-1 text-xs font-semibold shadow-xs h-7">
                <Plus className="size-3" />
                New Task
              </Button>
            }
          />
        </div>
      </div>

      {/* 2. Main Dashboard Content */}
      {statsQuery.isLoading ? (
        <DashboardSkeleton />
      ) : statsQuery.isError ? (
        <Alert variant="destructive" className="space-y-2">
          <div className="flex items-center gap-2 font-medium text-xs">
            <AlertCircle className="size-4" />
            Failed to load dashboard statistics.
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void statsQuery.refetch()}
            className="text-xs"
          >
            <RefreshCw className="mr-1.5 size-3.5" />
            Retry
          </Button>
        </Alert>
      ) : statsQuery.data ? (
        statsQuery.data.totalTasks === 0 ? (
          <DashboardEmptyState />
        ) : (
          <>
            {/* 4 Minimal KPI Cards */}
            <DashboardCards stats={statsQuery.data} />

            {/* Performance Trends & Analytics */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5">
                <LineChart className="size-3.5 text-muted-foreground" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Performance Trends & Analytics
                </h3>
              </div>

              <DashboardCharts stats={statsQuery.data} />
            </div>

            {/* Core Productivity Workspace: 2-Column Responsive Layout */}
            <div className="grid gap-3.5 lg:grid-cols-12 items-stretch">
              {/* Left Column: Focus Tasks, Upcoming Schedule & AI Insights (7 cols on lg) */}
              <div className="lg:col-span-7 space-y-3.5 flex flex-col">
                <DashboardTodayTasks
                  tasks={allTasks}
                  isLoading={tasksQuery.isLoading}
                />

                <DashboardUpcomingTasks
                  tasks={allTasks}
                  isLoading={tasksQuery.isLoading}
                />

                <DashboardInsights className="flex-1" />
              </div>

              {/* Right Column: AI Assistant & Calendar Preview (5 cols on lg) */}
              <div className="lg:col-span-5 space-y-3.5 flex flex-col">
                <DashboardAICard />

                <DashboardCalendarPreview tasks={allTasks} className="flex-1" />
              </div>
            </div>
          </>
        )
      ) : null}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* 4 KPI card skeletons */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={idx} className="h-20 w-full rounded-lg" />
        ))}
      </div>

      {/* Analytics skeleton */}
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-44 w-full rounded-lg" />
        <Skeleton className="h-44 w-full rounded-lg" />
      </div>

      {/* 2-column workspace skeletons */}
      <div className="grid gap-3.5 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-3.5">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="lg:col-span-5 space-y-3.5">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
