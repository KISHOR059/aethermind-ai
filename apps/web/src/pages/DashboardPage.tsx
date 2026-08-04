import { useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";

import { useDashboardStats } from "@/features/dashboard/dashboard.hooks";
import DashboardCards from "@/features/dashboard/DashboardCards";
import DashboardCharts from "@/features/dashboard/DashboardCharts";
import DashboardInsights from "@/features/dashboard/DashboardInsights";
import CreateTaskDialog from "@/features/tasks/CreateTaskDialog";
import WeeklyReviewDialog from "@/features/ai/WeeklyReviewDialog";
import {
  TaskEmptyState,
  TaskErrorState,
  TaskLoadingState,
} from "@/features/tasks/TaskStates";
import TaskList from "@/features/tasks/TaskList";
import { defaultTaskParams, useTasks } from "@/features/tasks/task.hooks";
import { Alert } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import PageHeader from "@/shared/components/PageHeader";
import { useAuth } from "@/features/auth/hooks/auth.context";

function DashboardPage() {
  const [weeklyReviewOpen, setWeeklyReviewOpen] = useState(false);
  const { user } = useAuth();
  const statsQuery = useDashboardStats();
  const tasks = useTasks(defaultTaskParams);
  const recentTasks = tasks.data?.items.slice(0, 5) ?? [];

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <PageHeader
        eyebrow="Overview"
        title={`Hello, ${user?.firstName ?? "there"}`}
        description="A focused view of your productivity analytics, performance trends, and AI insights."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setWeeklyReviewOpen(true)}
              className="gap-2"
            >
              <BarChart3 className="size-4 text-primary" />
              Weekly Review
            </Button>
            <CreateTaskDialog />
          </div>
        }
      />

      {/* 2. Dashboard Statistics & Cards */}
      {statsQuery.isLoading ? (
        <DashboardSkeleton />
      ) : statsQuery.isError ? (
        <Alert variant="destructive" className="space-y-3">
          <p className="text-sm">Failed to load dashboard statistics.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void statsQuery.refetch()}
          >
            <RefreshCw className="mr-1.5 size-3.5" />
            Retry
          </Button>
        </Alert>
      ) : statsQuery.data ? (
        <>
          {/* 7 Productivity Metric Cards */}
          <DashboardCards stats={statsQuery.data} />

          {/* 4 Analytics Charts */}
          <DashboardCharts stats={statsQuery.data} />
        </>
      ) : null}

      {/* 3. AI Insights Section */}
      <DashboardInsights />

      {/* 4. Recent Workspace Activity */}
      <section className="space-y-4">
        <PageHeader
          level="h2"
          title="Recent Tasks"
          description="Your most recently created tasks."
        />
        {tasks.isLoading ? (
          <TaskLoadingState />
        ) : tasks.isError ? (
          <TaskErrorState
            message={tasks.error.message}
            onRetry={() => void tasks.refetch()}
          />
        ) : recentTasks.length === 0 ? (
          <TaskEmptyState />
        ) : (
          <TaskList tasks={recentTasks} />
        )}
      </section>

      {/* Dialogs */}
      <WeeklyReviewDialog
        open={weeklyReviewOpen}
        onOpenChange={setWeeklyReviewOpen}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, idx) => (
          <Skeleton key={idx} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default DashboardPage;
