import TaskCard from "./TaskCard";
import TaskRow from "./TaskRow";
import type { Task } from "./task.types";

export interface TaskListProps {
  tasks: Task[];
  viewMode?: "list" | "grid";
  onSelectTask?: (task: Task) => void;
}

export function TaskList({ tasks, viewMode = "list", onSelectTask }: TaskListProps) {
  if (viewMode === "grid") {
    return (
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onSelect={onSelectTask} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} onSelect={onSelectTask} />
      ))}
    </div>
  );
}

export default TaskList;
