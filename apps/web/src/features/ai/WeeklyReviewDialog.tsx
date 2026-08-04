import { useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";

import type {
  AIExecutionMetrics,
  WeeklyReview,
} from "./ai.types";
import { useWeeklyReview } from "./ai.hooks";
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

export interface WeeklyReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WeeklyReviewDialog({
  open,
  onOpenChange,
}: WeeklyReviewDialogProps) {
  const reviewQuery = useWeeklyReview();

  useEffect(() => {
    if (open && (!reviewQuery.data || reviewQuery.isStale)) {
      void reviewQuery.refetch();
    }
  }, [open, reviewQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="size-5 text-primary" />
            Weekly Productivity Review
          </DialogTitle>
          <DialogDescription>
            AI-powered analysis of your work history over the last seven days.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-2">
          {reviewQuery.isFetching ? (
            <WeeklyReviewLoadingState />
          ) : reviewQuery.isError ? (
            <WeeklyReviewErrorState
              onRetry={() => void reviewQuery.refetch()}
            />
          ) : reviewQuery.data ? (
            <WeeklyReviewSuccessState
              review={reviewQuery.data.data}
              metrics={reviewQuery.data.metrics}
              onRefresh={() => void reviewQuery.refetch()}
              onClose={() => onOpenChange(false)}
            />
          ) : (
            <WeeklyReviewEmptyState
              onGenerate={() => void reviewQuery.refetch()}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const LOADING_MESSAGES = [
  "Analyzing past seven days of task history...",
  "Evaluating completed vs overdue tasks...",
  "Identifying productivity patterns & deep work...",
  "Formulating actionable recommendations...",
  "Calculating overall weekly score...",
];

function WeeklyReviewLoadingState() {
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
      aria-label="Generating Weekly Review"
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute size-16 animate-ping rounded-full bg-primary/10" />
        <div className="relative flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BarChart3 className="size-7 animate-pulse text-primary" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3 className="text-lg font-semibold tracking-tight">
          Generating weekly productivity review...
        </h3>
        <p className="text-xs text-muted-foreground">
          Analyzing task statistics and performance metrics across the past week.
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

function WeeklyReviewErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive" className="space-y-3 my-4">
      <div className="flex items-center gap-2 font-medium">
        <AlertCircle className="size-4" />
        Unable to generate weekly review
      </div>
      <p className="text-sm">
        The AI service encountered an issue processing your weekly work history. Please try again.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-1.5 size-3.5" />
        Try again
      </Button>
    </Alert>
  );
}

function WeeklyReviewEmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <Card className="my-4">
      <CardContent className="space-y-3 py-8 text-center">
        <Sparkles className="mx-auto size-8 text-muted-foreground" />
        <p className="font-medium">Ready for your Weekly Review?</p>
        <p className="text-sm text-muted-foreground">
          Analyze your past 7 days of performance, patterns, and accomplishments.
        </p>
        <Button onClick={onGenerate}>
          <BarChart3 className="mr-1.5 size-4" />
          Generate Review
        </Button>
      </CardContent>
    </Card>
  );
}

function WeeklyReviewSuccessState({
  review,
  metrics,
  onRefresh,
  onClose,
}: {
  review: WeeklyReview;
  metrics: AIExecutionMetrics;
  onRefresh: () => void;
  onClose: () => void;
}) {
  const { statistics } = review;
  const hoursWorked = Math.floor(statistics.estimatedMinutesWorked / 60);
  const minsWorked = statistics.estimatedMinutesWorked % 60;
  const formattedWorkTime = `${hoursWorked}h ${minsWorked}m`;

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="gap-1.5 font-semibold text-xs py-1">
          <Zap className="size-3.5 text-amber-500 fill-amber-500" />
          <Target className="size-3.5 text-primary" />
          {review.productivityScore}/100 Productivity Score
        </Badge>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          <RefreshCw className="size-3.5 mr-1" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-semibold">Weekly Summary</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {review.summary}
          </p>
        </CardContent>
      </Card>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-[320px] pr-3">
          <div className="space-y-4">
            {/* Statistics Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-primary" />
                Weekly Statistics
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                <div className="p-2.5 rounded-lg border bg-card space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">Completed</span>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {statistics.completedTasks}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg border bg-card space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">Pending</span>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {statistics.pendingTasks}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg border bg-card space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">Overdue</span>
                  <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                    {statistics.overdueTasks}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg border bg-card space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">Completion</span>
                  <p className="text-lg font-bold text-primary">
                    {statistics.completionRate}%
                  </p>
                </div>
                <div className="p-2.5 rounded-lg border bg-card space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium flex items-center justify-center gap-1">
                    <Clock className="size-3" />
                    Focus Time
                  </span>
                  <p className="text-sm font-bold text-foreground">
                    {formattedWorkTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Achievements Section */}
            {review.achievements.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Trophy className="size-3.5 text-amber-500" />
                  Key Achievements
                </h4>
                <div className="space-y-1.5">
                  {review.achievements.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-card text-xs text-foreground"
                    >
                      <CheckCircle2 className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights Section */}
            {review.insights.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Lightbulb className="size-3.5 text-blue-500" />
                  Productivity Insights
                </h4>
                <div className="space-y-1.5">
                  {review.insights.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-card text-xs text-foreground"
                    >
                      <Sparkles className="size-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations Section */}
            {review.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Zap className="size-3.5 text-primary" />
                  Suggestions for Next Week
                </h4>
                <div className="space-y-1.5">
                  {review.recommendations.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-card text-xs text-foreground"
                    >
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>{item}</span>
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
        <DialogFooter className="w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </div>
    </div>
  );
}

export default WeeklyReviewDialog;
