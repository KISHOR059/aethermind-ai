import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import type { AIExecutionMetrics, Subtask, TaskBreakdown } from "./ai.types";
import { useTaskBreakdown } from "./ai.hooks";
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
import { notify } from "@/shared/lib/notifications";
import { taskService } from "@/features/tasks/task.service";
import { taskKeys } from "@/features/tasks/task.hooks";
import TaskPriorityBadge from "@/features/tasks/TaskPriorityBadge";

export interface TaskBreakdownDialogProps {
  taskId: string;
  taskTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskBreakdownDialog({
  taskId,
  taskTitle,
  open,
  onOpenChange,
}: TaskBreakdownDialogProps) {
  const breakdownQuery = useTaskBreakdown(taskId);

  useEffect(() => {
    if (open && (!breakdownQuery.data || breakdownQuery.isStale)) {
      void breakdownQuery.refetch();
    }
  }, [open, breakdownQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="size-5 text-primary" />
            AI Task Breakdown
          </DialogTitle>
          <DialogDescription>
            Decompose &quot;{taskTitle}&quot; into actionable, atomic subtasks.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-2">
          {breakdownQuery.isFetching ? (
            <BreakdownLoadingState taskTitle={taskTitle} />
          ) : breakdownQuery.isError ? (
            <BreakdownErrorState onRetry={() => void breakdownQuery.refetch()} />
          ) : breakdownQuery.data ? (
            <BreakdownSuccessState
              taskId={taskId}
              parentTaskTitle={taskTitle}
              breakdown={breakdownQuery.data.data}
              metrics={breakdownQuery.data.metrics}
              onRefresh={() => void breakdownQuery.refetch()}
              onClose={() => onOpenChange(false)}
            />
          ) : (
            <BreakdownEmptyState onGenerate={() => void breakdownQuery.refetch()} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const LOADING_MESSAGES = [
  "Analyzing task details...",
  "Identifying core sub-components...",
  "Decomposing into actionable steps...",
  "Ordering dependencies...",
  "Finalizing task breakdown...",
];

function BreakdownLoadingState({ taskTitle }: { taskTitle: string }) {
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
      aria-label={`Breaking down task ${taskTitle}`}
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute size-16 animate-ping rounded-full bg-primary/10" />
        <div className="relative flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="size-7 animate-pulse text-primary" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3 className="text-lg font-semibold tracking-tight">
          Generating subtasks for &quot;{taskTitle}&quot;...
        </h3>
        <p className="text-xs text-muted-foreground">
          Local LLMs decompose complex tasks into ordered atomic steps. This takes up to 40 seconds.
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

function BreakdownErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive" className="space-y-3 my-4">
      <div className="flex items-center gap-2 font-medium">
        <AlertCircle className="size-4" />
        Unable to generate task breakdown
      </div>
      <p className="text-sm">
        The AI service encountered an issue building your subtasks. Please try again.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-1.5 size-3.5" />
        Try again
      </Button>
    </Alert>
  );
}

function BreakdownEmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <Card className="my-4">
      <CardContent className="space-y-3 py-8 text-center">
        <Sparkles className="mx-auto size-8 text-muted-foreground" />
        <p className="font-medium">Ready to break down this task?</p>
        <p className="text-sm text-muted-foreground">
          Generate an ordered list of actionable subtasks using AI.
        </p>
        <Button onClick={onGenerate}>
          <Sparkles className="mr-1.5 size-4" />
          Generate Subtasks
        </Button>
      </CardContent>
    </Card>
  );
}

function BreakdownSuccessState({
  parentTaskTitle,
  breakdown,
  metrics,
  onRefresh,
  onClose,
}: {
  taskId: string;
  parentTaskTitle: string;
  breakdown: TaskBreakdown;
  metrics: AIExecutionMetrics;
  onRefresh: () => void;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    () => new Set(breakdown.subtasks.map((_, i) => i)),
  );
  const [isSaving, setIsSaving] = useState(false);

  function toggleSubtask(index: number) {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selectedIndices.size === breakdown.subtasks.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(breakdown.subtasks.map((_, i) => i)));
    }
  }

  async function handleSave() {
    const selectedSubtasks = breakdown.subtasks.filter((_, i) =>
      selectedIndices.has(i),
    );

    if (selectedSubtasks.length === 0) {
      notify.error("Selection empty", "Please select at least one subtask to save.");
      return;
    }

    setIsSaving(true);
    try {
      await Promise.all(
        selectedSubtasks.map((subtask) =>
          taskService.create({
            title: `[${parentTaskTitle}] ${subtask.title}`,
            description: subtask.description,
            priority: subtask.priority,
            estimatedMinutes: subtask.estimatedMinutes,
          }),
        ),
      );

      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      notify.success(
        `Saved ${selectedSubtasks.length} subtask${selectedSubtasks.length > 1 ? "s" : ""} as tasks`,
      );
      onClose();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save subtasks";
      notify.error("Error saving subtasks", errorMessage);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1 font-medium">
            <Clock className="size-3.5" />
            Estimated: {breakdown.estimatedMinutes} mins
          </Badge>
          <Badge variant="outline">
            {breakdown.subtasks.length} Subtasks
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs">
            {selectedIndices.size === breakdown.subtasks.length
              ? "Deselect All"
              : "Select All"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isSaving}>
            <RefreshCw className="size-3.5 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-semibold">AI Plan Overview</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {breakdown.summary}
          </p>
        </CardContent>
      </Card>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-[340px] pr-3">
          <div className="space-y-3">
            {breakdown.subtasks.map((subtask: Subtask, index: number) => {
              const isSelected = selectedIndices.has(index);

              return (
                <Card
                  key={subtask.title + index}
                  className={`transition-all border cursor-pointer ${
                    isSelected
                      ? "border-primary/50 bg-primary/5 shadow-xs"
                      : "opacity-60 hover:opacity-80"
                  }`}
                  onClick={() => toggleSubtask(index)}
                >
                  <CardHeader className="p-3.5 flex flex-row items-start justify-between gap-3 space-y-0">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="pt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSubtask(index)}
                          className="size-4 accent-primary rounded cursor-pointer"
                          aria-label={`Select ${subtask.title}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <CardTitle className="text-sm font-medium leading-snug">
                          {index + 1}. {subtask.title}
                        </CardTitle>
                        {subtask.description && (
                          <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                            {subtask.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <TaskPriorityBadge priority={subtask.priority} />
                      {subtask.estimatedMinutes && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Clock className="size-2.5" />
                          {subtask.estimatedMinutes}m
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
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => void handleSave()}
            disabled={isSaving || selectedIndices.size === 0}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-1.5 size-3.5" />
                Save Subtasks ({selectedIndices.size})
              </>
            )}
          </Button>
        </DialogFooter>
      </div>
    </div>
  );
}

export default TaskBreakdownDialog;
