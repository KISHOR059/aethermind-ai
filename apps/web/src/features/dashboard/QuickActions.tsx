import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bot,
  Split,
  Zap,
} from "lucide-react";

import CreateTaskDialog from "@/features/tasks/CreateTaskDialog";
import PlanMyDayDialog from "@/features/ai/PlanMyDayDialog";
import WeeklyReviewDialog from "@/features/ai/WeeklyReviewDialog";
import TaskBreakdownDialog from "@/features/ai/TaskBreakdownDialog";
import type { Task } from "@/features/tasks/task.types";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

export interface QuickActionsProps {
  recentTasks?: Task[];
}

export function QuickActions({ recentTasks = [] }: QuickActionsProps) {
  const navigate = useNavigate();
  const [weeklyReviewOpen, setWeeklyReviewOpen] = useState(false);
  const [breakdownTask, setBreakdownTask] = useState<Task | null>(null);
  const [breakdownPickerOpen, setBreakdownPickerOpen] = useState(false);

  const activeTasks = recentTasks.filter((t) => t.status !== "COMPLETED");

  const handleBreakdownClick = () => {
    if (activeTasks.length === 1) {
      setBreakdownTask(activeTasks[0]);
    } else if (activeTasks.length > 1) {
      setBreakdownPickerOpen(true);
    } else if (recentTasks.length > 0) {
      setBreakdownTask(recentTasks[0]);
    } else {
      setBreakdownPickerOpen(true);
    }
  };

  return (
    <Card className="border-border/60 bg-card shadow-xs">
      <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Zap className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Quick Actions
            </h3>
            <p className="text-xs text-muted-foreground">
              Streamline your workflow with instant AI and task tools
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <CreateTaskDialog />

          <PlanMyDayDialog />

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/assistant")}
            className="gap-2 transition-all hover:bg-primary/10 hover:border-primary/30 text-xs"
          >
            <Bot className="size-4 text-indigo-500" />
            AI Assistant
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeeklyReviewOpen(true)}
            className="gap-2 transition-all hover:bg-primary/10 hover:border-primary/30 text-xs"
          >
            <BarChart3 className="size-4 text-emerald-500" />
            Weekly Review
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleBreakdownClick}
            className="gap-2 transition-all hover:bg-primary/10 hover:border-primary/30 text-xs"
          >
            <Split className="size-4 text-amber-500" />
            Break Down Task
          </Button>
        </div>
      </CardContent>

      {/* Weekly Review Dialog */}
      <WeeklyReviewDialog
        open={weeklyReviewOpen}
        onOpenChange={setWeeklyReviewOpen}
      />

      {/* Task breakdown picker modal if multiple active tasks */}
      <Dialog open={breakdownPickerOpen} onOpenChange={setBreakdownPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Split className="size-4 text-primary" />
              Select Task for AI Breakdown
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {recentTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No tasks available. Create a task first.
              </p>
            ) : (
              recentTasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setBreakdownTask(t);
                    setBreakdownPickerOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-lg border hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-between text-xs font-medium"
                >
                  <span className="truncate pr-2">{t.title}</span>
                  <span className="text-[10px] text-muted-foreground uppercase px-2 py-0.5 rounded bg-muted">
                    {t.priority}
                  </span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Breakdown Dialog */}
      {breakdownTask && (
        <TaskBreakdownDialog
          taskId={breakdownTask.id}
          taskTitle={breakdownTask.title}
          open={!!breakdownTask}
          onOpenChange={(open) => {
            if (!open) setBreakdownTask(null);
          }}
        />
      )}
    </Card>
  );
}

export default QuickActions;
