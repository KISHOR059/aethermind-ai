import { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";

import { useProductivityInsights } from "./dashboard.hooks";
import type { ProductivityInsights } from "./dashboard.types";
import type { AIExecutionMetrics } from "../ai/ai.types";
import { Alert } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { cn } from "@/shared/lib/cn";

export interface DashboardInsightsProps {
  className?: string;
}

export function DashboardInsights({ className }: DashboardInsightsProps) {
  const insightsQuery = useProductivityInsights();

  return (
    <Card className={cn("rounded-lg border-border/60 bg-card shadow-2xs flex flex-col", className)}>
      <CardHeader className="p-3 sm:p-3.5 pb-2 flex flex-row items-center justify-between border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-500">
            <Brain className="size-3" />
          </div>
          <div>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              AI Productivity Insights
              <Sparkles className="size-2.5 text-amber-500 fill-amber-500" />
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground">
              Deep analysis of work habits, streaks, and recommendations
            </CardDescription>
          </div>
        </div>

        <Button
          onClick={() => void insightsQuery.refetch()}
          disabled={insightsQuery.isFetching}
          className="gap-1 text-[11px] font-semibold h-6"
          size="xs"
          variant="outline"
        >
          {insightsQuery.isFetching ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Sparkles className="size-3 text-primary" />
          )}
          {insightsQuery.data ? "Refresh" : "Analyze"}
        </Button>
      </CardHeader>

      <CardContent className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
        {insightsQuery.isFetching ? (
          <InsightsLoadingState />
        ) : insightsQuery.isError ? (
          <InsightsErrorState onRetry={() => void insightsQuery.refetch()} />
        ) : insightsQuery.data ? (
          <InsightsSuccessState
            insights={insightsQuery.data.data}
            metrics={insightsQuery.data.metrics}
            onRefresh={() => void insightsQuery.refetch()}
          />
        ) : (
          <InsightsEmptyState onGenerate={() => void insightsQuery.refetch()} />
        )}
      </CardContent>
    </Card>
  );
}

const LOADING_MESSAGES = [
  "Gathering task completion metrics...",
  "Evaluating streak consistency...",
  "Detecting productivity peaks & bottlenecks...",
  "Formulating personalized recommendations...",
  "Calculating AI productivity score...",
];

function InsightsLoadingState() {
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
      className="flex-1 flex flex-col items-center justify-center space-y-3 py-6 text-center"
      aria-live="polite"
      aria-label="Analyzing productivity"
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute size-10 animate-ping rounded-full bg-primary/10" />
        <div className="relative flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Brain className="size-4 animate-pulse text-primary" />
        </div>
      </div>

      <div className="space-y-0.5 max-w-sm">
        <h4 className="text-xs font-semibold text-foreground">Analyzing productivity patterns...</h4>
        <p className="text-[11px] text-muted-foreground">
          Evaluating completion velocity, time blocks, and task priorities.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-1.5">
        <Progress className="h-1 w-full" />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5 transition-all duration-300">
            <Loader2 className="size-3 animate-spin text-primary" />
            {LOADING_MESSAGES[messageIndex]}
          </span>
          <span className="font-mono text-[10px]">{formattedTime}</span>
        </div>
      </div>
    </div>
  );
}

function InsightsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex-1 flex flex-col justify-center">
      <Alert variant="destructive" className="space-y-2 my-1">
        <div className="flex items-center gap-2 font-medium text-xs">
          <AlertCircle className="size-3.5" />
          Failed to generate productivity insights
        </div>
        <p className="text-[11px] text-muted-foreground">
          The AI model was unable to complete the analysis. Please verify your connection and try again.
        </p>
        <Button variant="outline" size="xs" onClick={onRetry} className="text-[11px] h-6">
          <RefreshCw className="mr-1 size-3" />
          Try again
        </Button>
      </Alert>
    </div>
  );
}

function InsightsEmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-6 px-4 text-center space-y-2.5 border border-dashed rounded-lg bg-muted/20 my-auto">
      <Sparkles className="mx-auto size-5 text-primary/70" />
      <div className="space-y-0.5">
        <p className="text-xs font-semibold text-foreground">Generate AI Productivity Insights</p>
        <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
          Analyze work habits, completion velocity, and personalized recommendations.
        </p>
      </div>
      <Button variant="outline" size="xs" onClick={onGenerate} className="gap-1 text-[11px] font-medium h-6 mt-1">
        <Sparkles className="size-3 text-primary" />
        Analyze Productivity
      </Button>
    </div>
  );
}

function InsightsSuccessState({
  insights,
  metrics,
  onRefresh,
}: {
  insights: ProductivityInsights;
  metrics: AIExecutionMetrics;
  onRefresh: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col justify-between space-y-2.5">
      <div className="space-y-2.5">
        {/* Header Banner */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/30 border border-border/60">
          <p className="text-[11px] text-foreground font-medium leading-relaxed">
            {insights.summary}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="secondary" className="gap-1 text-[10px] py-0.5 font-semibold">
              <Zap className="size-2.5 text-amber-500 fill-amber-500" />
              {insights.productivityScore}/100 Score
            </Badge>
            <Button variant="ghost" size="icon-xs" onClick={onRefresh} title="Refresh" className="size-5">
              <RefreshCw className="size-3" />
            </Button>
          </div>
        </div>

        {/* Grid of Strengths, Weaknesses, Patterns, Recommendations */}
        <div className="grid gap-2 sm:grid-cols-2">
          {/* 1. Strengths */}
          {insights.strengths.length > 0 && (
            <div className="space-y-1 p-2 rounded-md border border-border/60 bg-muted/10">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="size-3" />
                Key Strengths
              </h5>
              <ul className="space-y-0.5">
                {insights.strengths.map((item, idx) => (
                  <li key={idx} className="text-[11px] text-foreground/90 flex items-start gap-1">
                    <span className="text-emerald-500 font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 2. Weaknesses */}
          {insights.weaknesses.length > 0 && (
            <div className="space-y-1 p-2 rounded-md border border-border/60 bg-muted/10">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangle className="size-3" />
                Bottlenecks
              </h5>
              <ul className="space-y-0.5">
                {insights.weaknesses.map((item, idx) => (
                  <li key={idx} className="text-[11px] text-foreground/90 flex items-start gap-1">
                    <span className="text-rose-500 font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 3. Patterns */}
          {insights.patterns.length > 0 && (
            <div className="space-y-1 p-2 rounded-md border border-border/60 bg-muted/10">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Sparkles className="size-3" />
                Work Habits
              </h5>
              <ul className="space-y-0.5">
                {insights.patterns.map((item, idx) => (
                  <li key={idx} className="text-[11px] text-foreground/90 flex items-start gap-1">
                    <span className="text-blue-500 font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 4. Recommendations */}
          {insights.recommendations.length > 0 && (
            <div className="space-y-1 p-2 rounded-md border border-border/60 bg-muted/10">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Lightbulb className="size-3" />
                Recommendations
              </h5>
              <ul className="space-y-0.5">
                {insights.recommendations.map((item, idx) => (
                  <li key={idx} className="text-[11px] text-foreground/90 flex items-start gap-1">
                    <span className="text-amber-500 font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Execution Metrics Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground font-mono shrink-0">
        <span>
          {metrics.provider} • {metrics.model} • {metrics.executionTime}ms
        </span>
        {metrics.tokenUsage && (
          <span>{metrics.tokenUsage.totalTokens} tokens</span>
        )}
      </div>
    </div>
  );
}

export default DashboardInsights;
