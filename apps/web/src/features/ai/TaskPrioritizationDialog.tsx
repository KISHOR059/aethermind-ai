import { useEffect, useState } from "react";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  Lightbulb,
  Loader2,
  Medal,
  RefreshCw,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import type {
  AIExecutionMetrics,
  PrioritizedTask,
  TaskPrioritization,
} from "./ai.types";
import { usePrioritizeTasks } from "./ai.hooks";
import { Alert } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Progress } from "@/shared/components/ui/progress";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import ConfirmDialog from "@/shared/components/ConfirmDialog";
import { notify } from "@/shared/lib/notifications";
import { taskService } from "@/features/tasks/task.service";
import { taskKeys } from "@/features/tasks/task.hooks";

export interface TaskPrioritizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskPrioritizationDialog({
  open,
  onOpenChange,
}: TaskPrioritizationDialogProps) {
  const prioritizeQuery = usePrioritizeTasks();

  useEffect(() => {
    if (open && (!prioritizeQuery.data || prioritizeQuery.isStale)) {
      void prioritizeQuery.refetch();
    }
  }, [open, prioritizeQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="size-5 text-primary" />
            AI Task Prioritization
          </DialogTitle>
          <DialogDescription>
            Intelligent task ranking based on urgency, effort, dependencies, and energy balance.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-2">
          {prioritizeQuery.isFetching ? (
            <PrioritizationLoadingState />
          ) : prioritizeQuery.isError ? (
            <PrioritizationErrorState
              onRetry={() => void prioritizeQuery.refetch()}
            />
          ) : prioritizeQuery.data ? (
            <PrioritizationSuccessState
              prioritization={prioritizeQuery.data.data}
              metrics={prioritizeQuery.data.metrics}
              onRefresh={() => void prioritizeQuery.refetch()}
              onClose={() => onOpenChange(false)}
            />
          ) : (
            <PrioritizationEmptyState
              onGenerate={() => void prioritizeQuery.refetch()}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const LOADING_MESSAGES = [
  "Analyzing task deadlines & priorities...",
  "Evaluating task effort & dependencies...",
  "Balancing energy management & deep work...",
  "Ranking tasks for maximum efficiency...",
  "Finalizing prioritization plan...",
];

function PrioritizationLoadingState() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
    const msgTimer = setInterval(
      () => setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length),
      3500,
    );

    return () => {
      clearInterval(timer);
      clearInterval(msgTimer);
    };
  }, []);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div
      className="flex flex-col items-center justify-center space-y-6 py-10 text-center"
      aria-live="polite"
      aria-label="Prioritizing tasks"
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute size-16 animate-ping rounded-full bg-primary/10" />
        <div className="relative flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="size-7 animate-pulse text-primary" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3 className="text-lg font-semibold tracking-tight">
          Prioritizing your tasks...
        </h3>
        <p className="text-xs text-muted-foreground">
          Local LLMs analyze workloads and energy management to rank your tasks. This takes up to 40 seconds.
        </p>
      </div>

      <div className="w-full max-w-md space-y-3">
        <Progress className="h-2 w-full" />
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5 transition-all duration-300">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            {LOADING_MESSAGES[messageIndex]}
          </span>
          <span className="font-mono text-xs" aria-label={`Elapsed time ${formattedTime}`}>
            {formattedTime}
          </span>
        </div>
      </div>
    </div>
  );
}

function PrioritizationErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive" className="space-y-3 my-4">
      <div className="flex items-center gap-2 font-medium">
        <AlertCircle className="size-4" />
        Unable to prioritize tasks
      </div>
      <p className="text-sm">
        The AI service encountered an issue prioritizing your tasks. Please try again.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-1.5 size-3.5" />
        Try again
      </Button>
    </Alert>
  );
}

function PrioritizationEmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <Card className="my-4">
      <CardContent className="space-y-3 py-8 text-center">
        <Sparkles className="mx-auto size-8 text-muted-foreground" />
        <p className="font-medium">Ready to prioritize your tasks?</p>
        <p className="text-sm text-muted-foreground">
          Analyze deadlines, effort, and dependencies to optimize your workflow.
        </p>
        <Button onClick={onGenerate}>
          <Sparkles className="mr-1.5 size-4" />
          Prioritize Tasks
        </Button>
      </CardContent>
    </Card>
  );
}

function getRankBadge(rank: number) {
  switch (rank) {
    case 1:
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1 font-bold">
          <Trophy className="size-3" /> Rank #1
        </Badge>
      );
    case 2:
      return (
        <Badge className="bg-slate-400 hover:bg-slate-500 text-white gap-1 font-bold">
          <Medal className="size-3" /> Rank #2
        </Badge>
      );
    case 3:
      return (
        <Badge className="bg-amber-700 hover:bg-amber-800 text-white gap-1 font-bold">
          <Award className="size-3" /> Rank #3
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="font-semibold">
          #{rank}
        </Badge>
      );
  }
}

function getUrgencyBadge(urgency: PrioritizedTask["urgency"]) {
  switch (urgency) {
    case "URGENT":
      return (
        <Badge className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] gap-1">
          <AlertCircle className="size-3" /> URGENT
        </Badge>
      );
    case "HIGH":
      return (
        <Badge className="bg-red-500 hover:bg-red-600 text-white text-[10px] gap-1">
          <AlertCircle className="size-3" /> HIGH
        </Badge>
      );
    case "MEDIUM":
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] gap-1">
          <Clock className="size-3" /> MEDIUM
        </Badge>
      );
    case "LOW":
      return (
        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] gap-1">
          <CheckCircle2 className="size-3" /> LOW
        </Badge>
      );
    default:
      return <Badge variant="secondary">{urgency}</Badge>;
  }
}

function PrioritizationSuccessState({
  prioritization,
  metrics,
  onRefresh,
  onClose,
}: {
  prioritization: TaskPrioritization;
  metrics: AIExecutionMetrics;
  onRefresh: () => void;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [isApplying, setIsApplying] = useState(false);
  const [confirmApply, setConfirmApply] = useState(false);

  async function handleApplyPriorities() {
    setIsApplying(true);
    try {
      await Promise.all(
        prioritization.prioritizedTasks.map((pt) =>
          taskService.update(pt.taskId, { priority: pt.urgency }),
        ),
      );

      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      notify.success(
        `Updated priority for ${prioritization.prioritizedTasks.length} task${prioritization.prioritizedTasks.length > 1 ? "s" : ""}`,
      );
      onClose();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to apply priorities";
      notify.error("Error applying priorities", errorMessage);
    } finally {
      setIsApplying(false);
      setConfirmApply(false);
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="gap-1 font-medium">
          <Trophy className="size-3.5 text-amber-500" />
          {prioritization.prioritizedTasks.length} Tasks Ranked
        </Badge>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isApplying}>
          <RefreshCw className="size-3.5 mr-1" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-semibold">AI Overview</CardTitle>
        </CardHeader>
        <CardContent className="py-2 space-y-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {prioritization.summary}
          </p>
          {prioritization.recommendations.length > 0 && (
            <div className="pt-1 border-t space-y-1">
              <span className="text-[11px] font-medium flex items-center gap-1 text-primary">
                <Lightbulb className="size-3" />
                Recommendations:
              </span>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                {prioritization.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-[320px] pr-3">
          <div className="space-y-3">
            {prioritization.prioritizedTasks.map((pt, index) => {
              const rank = pt.recommendedPriority || index + 1;

              return (
                <Card key={pt.taskId || index} className="transition-all border">
                  <CardHeader className="p-3.5 flex flex-row items-start justify-between gap-3 space-y-0">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getRankBadge(rank)}
                        <CardTitle className="text-sm font-semibold truncate">
                          {pt.title}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                        <strong className="text-foreground">Reason:</strong> {pt.reason}
                      </CardDescription>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {getUrgencyBadge(pt.urgency)}
                      {pt.estimatedFocusMinutes && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Clock className="size-2.5" />
                          Focus: {pt.estimatedFocusMinutes}m
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-2 truncate">
          <span>
            {metrics.provider} • {metrics.model} • {metrics.executionTime}ms • v
            {metrics.promptVersion}
          </span>
          {metrics.tokenUsage && (
            <span>• {metrics.tokenUsage.totalTokens} tokens</span>
          )}
        </div>
        <DialogFooter className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isApplying}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => setConfirmApply(true)}
            disabled={isApplying || prioritization.prioritizedTasks.length === 0}
          >
            {isApplying ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-1.5 size-3.5" />
                Apply AI Priorities
              </>
            )}
          </Button>
        </DialogFooter>
      </div>

      <ConfirmDialog
        open={confirmApply}
        onOpenChange={setConfirmApply}
        title="Apply AI Priorities?"
        description="This will update task priorities in your database based on the AI recommendations."
        confirmLabel="Apply Priorities"
        onConfirm={() => void handleApplyPriorities()}
      />
    </div>
  );
}

export default TaskPrioritizationDialog;
