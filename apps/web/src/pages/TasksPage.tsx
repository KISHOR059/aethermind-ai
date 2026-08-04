import { useState } from "react";
import { BarChart3, CalendarClock, Sparkles } from "lucide-react";

import PlanMyDayDialog from "@/features/ai/PlanMyDayDialog";
import TaskPrioritizationDialog from "@/features/ai/TaskPrioritizationDialog";
import SmartRescheduleDialog from "@/features/ai/SmartRescheduleDialog";
import WeeklyReviewDialog from "@/features/ai/WeeklyReviewDialog";
import CreateTaskDialog from "@/features/tasks/CreateTaskDialog";
import {
  TaskEmptyState,
  TaskErrorState,
  TaskLoadingState,
} from "@/features/tasks/TaskStates";
import TaskList from "@/features/tasks/TaskList";
import { useTasks } from "@/features/tasks/task.hooks";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import PageHeader from "@/shared/components/PageHeader";

function TasksPage() {
  const [search, setSearch] = useState("");
  const [prioritizationOpen, setPrioritizationOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [weeklyReviewOpen, setWeeklyReviewOpen] = useState(false);

  const tasks = useTasks({
    page: 1,
    limit: 20,
    search: search || undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title="Tasks"
        description="Plan and prioritize your work."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setWeeklyReviewOpen(true)}
              className="gap-2"
            >
              <BarChart3 className="size-4 text-primary" />
              Weekly Review
            </Button>
            <Button
              variant="outline"
              onClick={() => setRescheduleOpen(true)}
              className="gap-2"
            >
              <CalendarClock className="size-4 text-primary" />
              Smart Reschedule
            </Button>
            <Button
              variant="outline"
              onClick={() => setPrioritizationOpen(true)}
              className="gap-2"
            >
              <Sparkles className="size-4 text-primary animate-pulse" />
              Prioritize Tasks
            </Button>
            <PlanMyDayDialog />
            <CreateTaskDialog />
          </div>
        }
      />
      <Input
        className="max-w-md"
        placeholder="Search tasks..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {tasks.isLoading ? (
        <TaskLoadingState />
      ) : tasks.isError ? (
        <TaskErrorState
          message={tasks.error.message}
          onRetry={() => void tasks.refetch()}
        />
      ) : !tasks.data || tasks.data.items.length === 0 ? (
        <TaskEmptyState />
      ) : (
        <TaskList tasks={tasks.data.items} />
      )}

      <TaskPrioritizationDialog
        open={prioritizationOpen}
        onOpenChange={setPrioritizationOpen}
      />
      <SmartRescheduleDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
      />
      <WeeklyReviewDialog
        open={weeklyReviewOpen}
        onOpenChange={setWeeklyReviewOpen}
      />
    </div>
  );
}

export default TasksPage;
