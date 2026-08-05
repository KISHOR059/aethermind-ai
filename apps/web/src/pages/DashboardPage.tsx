import { AlertCircle, RefreshCw } from "lucide-react";

import { useDashboardStats } from "@/features/dashboard/dashboard.hooks";
import DashboardCards from "@/features/dashboard/DashboardCards";
import DashboardCharts from "@/features/dashboard/DashboardCharts";
import DashboardInsights from "@/features/dashboard/DashboardInsights";
import QuickActions from "@/features/dashboard/QuickActions";
import DashboardEmptyState from "@/features/dashboard/DashboardEmptyState";
import CreateTaskDialog from "@/features/tasks/CreateTaskDialog";
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
  const { user } = useAuth();
  const statsQuery = useDashboardStats();
  const tasks = useTasks(defaultTaskParams);
  const recentTasks = tasks.data?.items.slice(0, 5) ?? [];

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6 pb-8">
      {/* 1. Page Header */}
      <PageHeader
        eyebrow="Overview"
        title={`Hello, ${user?.firstName ?? "there"}`}
        description="A focused view of your productivity analytics, performance trends, and AI insights."
        actions={
          <div className="flex items-center gap-2">
            <CreateTaskDialog />
          </div>
        }
      />

      {/* 2. Quick Actions Bar */}
      <QuickActions recentTasks={recentTasks} />

      {/* 3. Main Dashboard Content */}
      {statsQuery.isLoading ? (
        <DashboardSkeleton />
      ) : statsQuery.isError ? (
        <Alert variant="destructive" className="space-y-3">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="size-4" />
            Failed to load dashboard statistics.
          </div>
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
        statsQuery.data.totalTasks === 0 ? (
          <DashboardEmptyState />
        ) : (
          <>
            {/* 7 Productivity Metric Cards */}
            <DashboardCards stats={statsQuery.data} />

            {/* 4 Analytics Charts */}
            <DashboardCharts stats={statsQuery.data} />

            {/* AI Insights Section */}
            <DashboardInsights />
          </>
        )
      ) : null}

      {/* 4. Recent Workspace Activity */}
      <section className="space-y-4 pt-2">
        <PageHeader
          level="h2"
          title="Recent Tasks"
          description="Your most recently created tasks across the workspace."
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
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, idx) => (
          <Skeleton key={idx} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default DashboardPage;
