import { CheckCircle2, ListTodo, TrendingUp } from "lucide-react";

import CreateTaskDialog from "@/features/tasks/CreateTaskDialog";
import { TaskEmptyState, TaskErrorState, TaskLoadingState } from "@/features/tasks/TaskStates";
import TaskList from "@/features/tasks/TaskList";
import { defaultTaskParams, useTaskCounts, useTasks } from "@/features/tasks/task.hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import PageHeader from "@/shared/components/PageHeader";

function isToday(value?: string) {
  if (!value) return false;
  const date = new Date(value); const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

function DashboardPage() {
  const tasks = useTasks(defaultTaskParams);
  const counts = useTaskCounts();
  const items = tasks.data?.items ?? [];
  const todayTasks = items.filter((task) => isToday(task.dueDate));
  return <div className="space-y-8">
    <PageHeader eyebrow="Overview" title="Your tasks" description="A focused view of what needs your attention." actions={<CreateTaskDialog />} />
    <div className="grid gap-4 sm:grid-cols-3"><Card><CardHeader className="flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm font-medium">Today&apos;s Tasks</CardTitle><ListTodo className="size-4 text-primary" /></CardHeader><CardContent><p className="text-3xl font-semibold">{todayTasks.length}</p><p className="text-xs text-muted-foreground">Due today</p></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm font-medium">Recent Tasks</CardTitle><TrendingUp className="size-4 text-primary" /></CardHeader><CardContent><p className="text-3xl font-semibold">{items.length}</p><p className="text-xs text-muted-foreground">Loaded from your workspace</p></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm font-medium">Task Counts</CardTitle><CheckCircle2 className="size-4 text-primary" /></CardHeader><CardContent><p className="text-3xl font-semibold">{counts.todo + counts.inProgress}</p><p className="text-xs text-muted-foreground">Open · {counts.completed} completed</p></CardContent></Card></div>
    <section className="space-y-4"><PageHeader level="h2" title="Recent Tasks" description="Your most recently created tasks." />{tasks.isLoading ? <TaskLoadingState /> : tasks.isError ? <TaskErrorState message={tasks.error.message} onRetry={() => void tasks.refetch()} /> : items.length === 0 ? <TaskEmptyState /> : <TaskList tasks={items.slice(0, 5)} />}</section>
  </div>;
}

export default DashboardPage;
