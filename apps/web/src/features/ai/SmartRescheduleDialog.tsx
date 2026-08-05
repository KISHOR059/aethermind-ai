import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import type {
  AIExecutionMetrics,
  SmartReschedule,
} from "./ai.types";
import { useSmartReschedule } from "./ai.hooks";
import { Alert } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
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
import { invalidateWorkspaceTaskQueries } from "@/shared/lib/query.utils";

export interface SmartRescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SmartRescheduleDialog({
  open,
  onOpenChange,
}: SmartRescheduleDialogProps) {
  const rescheduleQuery = useSmartReschedule();

  useEffect(() => {
    if (open && (!rescheduleQuery.data || rescheduleQuery.isStale)) {
      void rescheduleQuery.refetch();
    }
  }, [open, rescheduleQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="size-5 text-primary" />
            Smart Reschedule
          </DialogTitle>
          <DialogDescription>
            Intelligently reorganize overdue and unfinished work into a realistic schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-2">
          {rescheduleQuery.isFetching ? (
            <RescheduleLoadingState />
          ) : rescheduleQuery.isError ? (
            <RescheduleErrorState
              onRetry={() => void rescheduleQuery.refetch()}
            />
          ) : rescheduleQuery.data ? (
            <RescheduleSuccessState
              reschedule={rescheduleQuery.data.data}
              metrics={rescheduleQuery.data.metrics}
              onRefresh={() => void rescheduleQuery.refetch()}
              onClose={() => onOpenChange(false)}
            />
          ) : (
            <RescheduleEmptyState
              onGenerate={() => void rescheduleQuery.refetch()}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const LOADING_MESSAGES = [
  "Analyzing overdue & unfinished tasks...",
  "Evaluating due dates & estimated effort...",
  "Building optimal revised schedule...",
  "Balancing daily workload & breaks...",
  "Calculating productivity score...",
];

function RescheduleLoadingState() {
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
      aria-label="Smart Rescheduling Tasks"
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute size-16 animate-ping rounded-full bg-primary/10" />
        <div className="relative flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="size-7 animate-pulse text-primary" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3 className="text-lg font-semibold tracking-tight">
          Generating smart schedule...
        </h3>
        <p className="text-xs text-muted-foreground">
          Local LLMs reorganize overdue work and balance daily workloads. This takes up to 40 seconds.
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

function RescheduleErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive" className="space-y-3 my-4">
      <div className="flex items-center gap-2 font-medium">
        <AlertCircle className="size-4" />
        Unable to reschedule tasks
      </div>
      <p className="text-sm">
        The AI service encountered an issue generating a revised schedule. Please try again.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-1.5 size-3.5" />
        Try again
      </Button>
    </Alert>
  );
}

function RescheduleEmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <Card className="my-4">
      <CardContent className="space-y-3 py-8 text-center">
        <Sparkles className="mx-auto size-8 text-muted-foreground" />
        <p className="font-medium">Ready to smart reschedule?</p>
        <p className="text-sm text-muted-foreground">
          Reorganize overdue tasks and optimize your day.
        </p>
        <Button onClick={onGenerate}>
          <Sparkles className="mr-1.5 size-4" />
          Smart Reschedule
        </Button>
      </CardContent>
    </Card>
  );
}

function RescheduleSuccessState({
  reschedule,
  metrics,
  onRefresh,
  onClose,
}: {
  reschedule: SmartReschedule;
  metrics: AIExecutionMetrics;
  onRefresh: () => void;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [isApplying, setIsApplying] = useState(false);
  const [confirmApply, setConfirmApply] = useState(false);

  async function handleApplySchedule() {
    setIsApplying(true);
    try {
      if (reschedule.movedTasks.length > 0) {
        await Promise.all(
          reschedule.movedTasks.map((mt) =>
            taskService.update(mt.taskId, { dueDate: mt.newDate }),
          ),
        );
      }

      await invalidateWorkspaceTaskQueries(queryClient);
      notify.success(
        `Applied revised schedule successfully! ${reschedule.movedTasks.length > 0 ? `Rescheduled ${reschedule.movedTasks.length} task(s).` : ""}`,
      );
      onClose();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to apply schedule";
      notify.error("Error applying schedule", errorMessage);
    } finally {
      setIsApplying(false);
      setConfirmApply(false);
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="gap-1.5 font-semibold text-xs py-1">
          <Zap className="size-3.5 text-amber-500 fill-amber-500" />
          {reschedule.productivityScore}/100 Productivity Score
        </Badge>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isApplying}>
          <RefreshCw className="size-3.5 mr-1" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-semibold">Reschedule Overview</CardTitle>
        </CardHeader>
        <CardContent className="py-2 space-y-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {reschedule.summary}
          </p>
          {reschedule.recommendations.length > 0 && (
            <div className="pt-1 border-t space-y-1">
              <span className="text-[11px] font-medium flex items-center gap-1 text-primary">
                <Lightbulb className="size-3" />
                Recommendations:
              </span>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                {reschedule.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-[320px] pr-3">
          <div className="space-y-4">
            {/* Revised Schedule Section */}
            {reschedule.schedule.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  Revised Daily Schedule
                </h4>
                <div className="space-y-2">
                  {reschedule.schedule.map((item, idx) => (
                    <div
                      key={item.taskId || idx}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors"
                    >
                      <Badge variant="outline" className="font-mono text-xs shrink-0 mt-0.5">
                        {item.time}
                      </Badge>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium truncate">
                            {item.title}
                          </span>
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            {item.estimatedMinutes} min
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Moved Tasks Section */}
            {reschedule.movedTasks.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  Rescheduled Dates ({reschedule.movedTasks.length})
                </h4>
                <div className="space-y-2">
                  {reschedule.movedTasks.map((mt, idx) => (
                    <div
                      key={mt.taskId || idx}
                      className="p-3 rounded-lg border bg-card space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                        <span className="font-medium text-foreground">
                          Task ID: {mt.taskId.slice(0, 8)}...
                        </span>
                        <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
                          <span>{mt.oldDate}</span>
                          <ArrowRight className="size-3 text-primary" />
                          <span className="font-semibold text-primary">{mt.newDate}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <strong className="text-foreground">Reason:</strong> {mt.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            disabled={isApplying}
          >
            {isApplying ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-1.5 size-3.5" />
                Apply Schedule
              </>
            )}
          </Button>
        </DialogFooter>
      </div>

      <ConfirmDialog
        open={confirmApply}
        onOpenChange={setConfirmApply}
        title="Apply Revised Schedule?"
        description={`This will update the due dates for ${reschedule.movedTasks.length} rescheduled task(s) in your database.`}
        confirmLabel="Apply Schedule"
        onConfirm={() => void handleApplySchedule()}
      />
    </div>
  );
}

export default SmartRescheduleDialog;
