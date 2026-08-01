import { useState } from "react";

import CreateTaskDialog from "@/features/tasks/CreateTaskDialog";
import { TaskEmptyState, TaskErrorState, TaskLoadingState } from "@/features/tasks/TaskStates";
import TaskList from "@/features/tasks/TaskList";
import { useTasks } from "@/features/tasks/task.hooks";
import { Input } from "@/shared/components/ui/input";

function TasksPage() {
  const [search, setSearch] = useState("");
  const tasks = useTasks({ page: 1, limit: 20, search: search || undefined, sortBy: "createdAt", sortOrder: "desc" });
  return <div className="space-y-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-muted-foreground">Workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Tasks</h1><p className="mt-2 text-muted-foreground">Plan and prioritize your work.</p></div><CreateTaskDialog /></div>
    <Input className="max-w-md" placeholder="Search tasks..." value={search} onChange={(event) => setSearch(event.target.value)} />
    {tasks.isLoading ? <TaskLoadingState /> : tasks.isError ? <TaskErrorState message={tasks.error.message} onRetry={() => void tasks.refetch()} /> : !tasks.data || tasks.data.items.length === 0 ? <TaskEmptyState /> : <TaskList tasks={tasks.data.items} />}
  </div>;
}

export default TasksPage;
