import { useEffect, useState } from "react";
import {
  AlertCircle,
  Clock3,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import type { AIExecutionMetrics, DailyPlan } from "./ai.types";
import { usePlanDay } from "./ai.hooks";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Progress } from "@/shared/components/ui/progress";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Separator } from "@/shared/components/ui/separator";

export interface PlanMyDayDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PlanMyDayDialog({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: PlanMyDayDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;

  const plan = usePlanDay();

  function handleOpenChange(nextOpen: boolean) {
    if (isControlled) {
      externalOnOpenChange?.(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }

    if (nextOpen && (!plan.data || plan.isStale)) {
      void plan.refetch();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline">
            <Sparkles />
            Plan My Day
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Daily Plan</DialogTitle>
          <DialogDescription>
            A focused plan based on your current tasks.
          </DialogDescription>
        </DialogHeader>

        {plan.isFetching ? (
          <PlanLoadingState />
        ) : plan.isError ? (
          <PlanErrorState onRetry={() => void plan.refetch()} />
        ) : plan.data ? (
          <PlanSuccessState
            plan={plan.data.data}
            metrics={plan.data.metrics}
            onRefresh={() => void plan.refetch()}
          />
        ) : (
          <PlanEmptyState onGenerate={() => void plan.refetch()} />
        )}
      </DialogContent>
    </Dialog>
  );
}

const LOADING_STATUS_MESSAGES = [
  "Analyzing your tasks...",
  "Identifying priorities...",
  "Building today's schedule...",
  "Generating recommendations...",
  "Finalizing your plan...",
];

function PlanLoadingState() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_STATUS_MESSAGES.length);
    }, 3500);

    return () => {
      clearInterval(timer);
      clearInterval(messageTimer);
    };
  }, []);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div
      className="flex flex-col items-center justify-center space-y-6 py-8 text-center"
      aria-live="polite"
      aria-label="Creating your daily plan"
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute size-16 animate-ping rounded-full bg-primary/10" />
        <div className="relative flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="size-7 animate-pulse text-primary" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-lg font-semibold tracking-tight">Creating your daily plan...</h3>
        <p className="text-xs text-muted-foreground">
          Local AI models optimize your schedule in real-time. This may take up to a minute.
        </p>
      </div>

      <div className="w-full max-w-md space-y-3">
        <Progress className="h-2 w-full" />
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5 transition-all duration-300">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            {LOADING_STATUS_MESSAGES[messageIndex]}
          </span>
          <span className="font-mono text-xs" aria-label={`Elapsed time ${formattedTime}`}>
            {formattedTime}
          </span>
        </div>
      </div>
    </div>
  );
}

function PlanErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive" className="space-y-3">
      <div className="flex items-center gap-2 font-medium">
        <AlertCircle className="size-4" />
        Unable to create your daily plan
      </div>
      <p className="text-sm">
        The AI planner is temporarily unavailable. Please try again.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </Alert>
  );
}

function PlanEmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <Card>
      <CardContent className="space-y-3 py-8 text-center">
        <Sparkles className="mx-auto size-8 text-muted-foreground" />
        <p className="font-medium">Ready to plan your day?</p>
        <p className="text-sm text-muted-foreground">
          Let the AI coach organize your tasks into a focused schedule.
        </p>
        <Button onClick={onGenerate}>Create plan</Button>
      </CardContent>
    </Card>
  );
}

function PlanSuccessState({
  plan,
  metrics,
  onRefresh,
}: {
  plan: DailyPlan;
  metrics: AIExecutionMetrics;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="secondary">
          Productivity score: {plan.productivityScore}/100
        </Badge>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          <RefreshCw />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{plan.summary}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Priority Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {plan.priorities.length > 0 ? (
              plan.priorities.map((priority) => (
                <div key={priority} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline">Priority</Badge>
                  <span>{priority}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No priority tasks were identified.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {plan.recommendations.length > 0 ? (
              plan.recommendations.map((recommendation) => (
                <p
                  key={recommendation}
                  className="text-sm text-muted-foreground"
                >
                  {recommendation}
                </p>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No additional recommendations.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suggested Schedule</CardTitle>
          <CardDescription>
            Designed to reduce context switching.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48 pr-4">
            <div className="space-y-3">
              {plan.schedule.length > 0 ? (
                plan.schedule.map((item) => (
                  <div key={item.time + item.task} className="space-y-3">
                    <div className="flex items-start gap-3 text-sm">
                      <Badge variant="secondary">
                        <Clock3 />
                        {item.time}
                      </Badge>
                      <span>{item.task}</span>
                    </div>
                    <Separator />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No schedule was generated.
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {metrics.provider} - {metrics.model} - {metrics.executionTime}ms
      </p>
    </div>
  );
}

export default PlanMyDayDialog;
