import { useState } from "react";
import {
  AlertCircle,
  Clock3,
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
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";

function PlanMyDayDialog() {
  const [open, setOpen] = useState(false);
  const plan = usePlanDay();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen && (!plan.data || plan.isStale)) {
      void plan.refetch();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles />
          Plan My Day
        </Button>
      </DialogTrigger>
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

function PlanLoadingState() {
  return (
    <div className="space-y-4" aria-label="Loading daily plan">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-36 w-full" />
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
