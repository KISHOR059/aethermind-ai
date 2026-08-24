import { useState } from "react";
import { CheckCircle2, Circle, Clock3, Plus, Sparkles } from "lucide-react";

import type { Task } from "@/features/tasks/task.types";
import { useUpdateTask } from "@/features/tasks/task.hooks";
import { formatShortTaskDueDate, isTaskSameDay } from "@/features/tasks/task.utils";
import TaskPriorityBadge from "@/features/tasks/TaskPriorityBadge";
import { TaskDetailsDrawer } from "@/features/tasks/TaskDetailsDrawer";
import CreateTaskDialog from "@/features/tasks/CreateTaskDialog";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { notify } from "@/shared/lib/notifications";

export interface DashboardTodayTasksProps {
  tasks: Task[];
  isLoading?: boolean;
}

export function DashboardTodayTasks({ tasks, isLoading }: DashboardTodayTasksProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const updateTask = useUpdateTask();

  const now = new Date();
  const todayTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    return isTaskSameDay(task.dueDate, now);
  });

  const completedTodayCount = todayTasks.filter((t) => t.status === "COMPLETED").length;

  const handleToggleTask = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";
    updateTask.mutate(
      { id: task.id, input: { status: newStatus } },
      {
        onSuccess: () => {
          notify.success(
            newStatus === "COMPLETED" ? "Task completed" : "Task marked incomplete",
            task.title,
          );
        },
      },
    );
  };

  return (
    <>
      <Card className="rounded-lg border-border/60 bg-card shadow-2xs">
        <CardHeader className="p-3 sm:p-3.5 pb-2 flex flex-row items-center justify-between border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
              Today's Tasks
            </CardTitle>
            {todayTasks.length > 0 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                {completedTodayCount}/{todayTasks.length}
              </span>
            )}
          </div>

          <CreateTaskDialog
            trigger={
              <Button variant="ghost" size="icon-xs" className="size-6 text-muted-foreground hover:text-foreground">
                <Plus className="size-3.5" />
                <span className="sr-only">Add task</span>
              </Button>
            }
          />
        </CardHeader>

        <CardContent className="p-2 sm:p-2.5">
          {isLoading ? (
            <div className="space-y-2 py-1">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-8 rounded-md bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : todayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-4 space-y-2">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="size-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">You're all caught up</p>
                <p className="text-[11px] text-muted-foreground max-w-xs">
                  No tasks scheduled for today. Enjoy the breathing room.
                </p>
              </div>
              <CreateTaskDialog
                trigger={
                  <Button variant="outline" size="xs" className="gap-1 text-[11px] font-medium mt-0.5 h-6.5">
                    <Plus className="size-3" />
                    Create Task
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {todayTasks.map((task) => {
                const isCompleted = task.status === "COMPLETED";
                const shortDue = formatShortTaskDueDate(task.dueDate);

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="group flex items-center justify-between gap-2.5 py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => handleToggleTask(task, e)}
                        className="text-muted-foreground hover:text-primary transition-colors shrink-0 focus:outline-none"
                        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="size-4 text-emerald-500 fill-emerald-500/10" />
                        ) : (
                          <Circle className="size-4 text-muted-foreground/60 group-hover:text-muted-foreground" />
                        )}
                      </button>

                      <span
                        className={`text-xs font-medium truncate transition-colors ${
                          isCompleted
                            ? "text-muted-foreground line-through decoration-muted-foreground/60"
                            : "text-foreground group-hover:text-primary"
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <TaskPriorityBadge priority={task.priority} />
                      {shortDue && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                          <Clock3 className="size-2.5 text-muted-foreground/70" />
                          {shortDue.includes("·") ? shortDue.split("·")[1].trim() : shortDue}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTask && (
        <TaskDetailsDrawer
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => {
            if (!open) setSelectedTask(null);
          }}
        />
      )}
    </>
  );
}

export default DashboardTodayTasks;
