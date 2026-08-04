import TaskCard from "./TaskCard";
import type { Task } from "./task.types";

function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}

export default TaskList;
