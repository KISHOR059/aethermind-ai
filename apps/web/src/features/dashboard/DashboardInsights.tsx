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
  Target,
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

export function DashboardInsights() {
  const insightsQuery = useProductivityInsights();

  return (
    <Card className="rounded-xl border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
            <Brain className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              AI Productivity Insights
              <Sparkles className="size-4 text-amber-500 fill-amber-500 animate-pulse" />
            </CardTitle>
            <CardDescription className="text-xs">
              Deep analysis of your work habits, strengths, bottlenecks, and recommendations
            </CardDescription>
          </div>
        </div>
        <Button
          onClick={() => void insightsQuery.refetch()}
          disabled={insightsQuery.isFetching}
          className="gap-2 text-xs font-semibold shadow-xs"
          size="sm"
        >
          {insightsQuery.isFetching ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5 text-amber-300" />
          )}
          Analyze Productivity
        </Button>
      </CardHeader>

      <CardContent>
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
  "Gathering 30-day task completion metrics...",
  "Evaluating streak consistency and completion rates...",
  "Detecting productivity peaks and work bottlenecks...",
  "Formulating personalized habit recommendations...",
  "Calculating final AI productivity score...",
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
      className="flex flex-col items-center justify-center space-y-6 py-8 text-center"
      aria-live="polite"
      aria-label="Analyzing productivity"
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute size-16 animate-ping rounded-full bg-primary/10" />
        <div className="relative flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Brain className="size-7 animate-pulse text-primary" />
        </div>
      </div>

      <div className="space-y-1 max-w-md">
        <h4 className="text-base font-semibold">Analyzing your productivity data...</h4>
        <p className="text-xs text-muted-foreground">
          Processing completion history, streaks, and work habits over the last 30 days.
        </p>
      </div>

      <div className="w-full max-w-md space-y-3">
        <Progress className="h-2 w-full" />
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5 transition-all duration-300">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            {LOADING_MESSAGES[messageIndex]}
          </span>
          <span className="font-mono text-xs">{formattedTime}</span>
        </div>
      </div>
    </div>
  );
}

function InsightsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive" className="space-y-3 my-2">
      <div className="flex items-center gap-2 font-medium text-sm">
        <AlertCircle className="size-4" />
        Failed to generate productivity insights
      </div>
      <p className="text-xs">
        The AI model was unable to complete the analysis. Please verify local LLM service status and try again.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry} className="text-xs">
        <RefreshCw className="mr-1.5 size-3.5" />
        Try again
      </Button>
    </Alert>
  );
}

function InsightsEmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="py-8 text-center space-y-3 border border-dashed rounded-xl bg-muted/20">
      <Sparkles className="mx-auto size-8 text-primary/70" />
      <div className="space-y-1">
        <p className="text-sm font-semibold">Discover your AI Productivity Insights</p>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Click below to let AI analyze your work habits, strengths, bottlenecks, and personalized recommendations.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onGenerate} className="gap-1.5 text-xs">
        <Sparkles className="size-3.5 text-primary" />
        Analyze Productivity Now
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/40 border">
        <div className="space-y-1">
          <p className="text-sm text-foreground font-medium leading-relaxed">
            {insights.summary}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className="gap-1 text-xs py-1 font-semibold">
            <Zap className="size-3.5 text-amber-500 fill-amber-500" />
            <Target className="size-3.5 text-primary" />
            {insights.productivityScore}/100 Score
          </Badge>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Grid of Strengths, Weaknesses, Patterns, Recommendations */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 1. Strengths */}
        {insights.strengths.length > 0 && (
          <div className="space-y-2 p-3.5 rounded-xl border bg-card shadow-2xs">
            <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="size-4" />
              Key Strengths
            </h5>
            <ul className="space-y-1.5">
              {insights.strengths.map((item, idx) => (
                <li key={idx} className="text-xs text-foreground flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 2. Weaknesses */}
        {insights.weaknesses.length > 0 && (
          <div className="space-y-2 p-3.5 rounded-xl border bg-card shadow-2xs">
            <h5 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="size-4" />
              Weaknesses & Bottlenecks
            </h5>
            <ul className="space-y-1.5">
              {insights.weaknesses.map((item, idx) => (
                <li key={idx} className="text-xs text-foreground flex items-start gap-2">
                  <span className="text-rose-500 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. Patterns */}
        {insights.patterns.length > 0 && (
          <div className="space-y-2 p-3.5 rounded-xl border bg-card shadow-2xs">
            <h5 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Sparkles className="size-4" />
              Work Patterns & Habits
            </h5>
            <ul className="space-y-1.5">
              {insights.patterns.map((item, idx) => (
                <li key={idx} className="text-xs text-foreground flex items-start gap-2">
                  <span className="text-blue-500 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 4. Recommendations */}
        {insights.recommendations.length > 0 && (
          <div className="space-y-2 p-3.5 rounded-xl border bg-card shadow-2xs">
            <h5 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Lightbulb className="size-4" />
              Recommendations
            </h5>
            <ul className="space-y-1.5">
              {insights.recommendations.map((item, idx) => (
                <li key={idx} className="text-xs text-foreground flex items-start gap-2">
                  <span className="text-amber-500 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Execution Metrics Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-[11px] text-muted-foreground">
        <span>
          {metrics.provider} • {metrics.model} • {metrics.executionTime}ms • v
          {metrics.promptVersion}
        </span>
        {metrics.tokenUsage && (
          <span>{metrics.tokenUsage.totalTokens} tokens processed</span>
        )}
      </div>
    </div>
  );
}

export default DashboardInsights;
