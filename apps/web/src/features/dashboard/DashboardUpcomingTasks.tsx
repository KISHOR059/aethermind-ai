import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock3 } from "lucide-react";

import type { Task } from "@/features/tasks/task.types";
import { formatShortTaskDueDate, isTaskSameDay } from "@/features/tasks/task.utils";
import TaskPriorityBadge from "@/features/tasks/TaskPriorityBadge";
import { TaskDetailsDrawer } from "@/features/tasks/TaskDetailsDrawer";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export interface DashboardUpcomingTasksProps {
  tasks: Task[];
  isLoading?: boolean;
}

export function DashboardUpcomingTasks({ tasks, isLoading }: DashboardUpcomingTasksProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const now = new Date();
  const upcomingTasks = tasks
    .filter((task) => {
      if (!task.dueDate || task.status === "COMPLETED") return false;
      const dueDate = new Date(task.dueDate);
      if (isTaskSameDay(task.dueDate, now)) return false;
      return dueDate.getTime() > now.getTime();
    })
    .sort((a, b) => {
      const timeA = new Date(a.dueDate!).getTime();
      const timeB = new Date(b.dueDate!).getTime();
      return timeA - timeB;
    })
    .slice(0, 5);

  return (
    <>
      <Card className="rounded-lg border-border/60 bg-card shadow-2xs">
        <CardHeader className="p-3 sm:p-3.5 pb-2 flex flex-row items-center justify-between border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-blue-500" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
              Upcoming Schedule
            </CardTitle>
          </div>

          <Button
            asChild
            variant="ghost"
            size="xs"
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground gap-1 -mr-1 h-6"
          >
            <Link to="/calendar">
              Calendar
              <ArrowRight className="size-2.5" />
            </Link>
          </Button>
        </CardHeader>

        <CardContent className="p-2 sm:p-2.5">
          {isLoading ? (
            <div className="space-y-2 py-1">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-8 rounded-md bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : upcomingTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-4 space-y-1.5">
              <div className="size-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Calendar className="size-3.5" />
              </div>
              <p className="text-xs font-medium text-foreground">No upcoming tasks</p>
              <p className="text-[11px] text-muted-foreground">
                Your schedule is clear for the coming days.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {upcomingTasks.map((task) => {
                const shortDue = formatShortTaskDueDate(task.dueDate);

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="group flex items-center justify-between gap-2.5 py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="size-1.5 rounded-full bg-muted-foreground/40 group-hover:bg-primary transition-colors shrink-0" />
                      <span className="text-xs font-medium text-foreground group-hover:text-primary truncate transition-colors">
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <TaskPriorityBadge priority={task.priority} />
                      {shortDue && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                          <Clock3 className="size-2.5 text-muted-foreground/70" />
                          {shortDue}
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

export default DashboardUpcomingTasks;
