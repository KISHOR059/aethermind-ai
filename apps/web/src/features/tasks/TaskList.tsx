import TaskCard from "./TaskCard";
import type { Task } from "./task.types";

function TaskList({ tasks }: { tasks: Task[] }) {
  return <div className="grid gap-4 md:grid-cols-2">{tasks.map((task) => <TaskCard key={task.id} task={task} />)}</div>;
}

export default TaskList;

