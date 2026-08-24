import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CalendarCheck,
  Plus,
  Sparkles,
} from "lucide-react";

import CreateTaskDialog from "@/features/tasks/CreateTaskDialog";
import PlanMyDayDialog from "@/features/ai/PlanMyDayDialog";
import WeeklyReviewDialog from "@/features/ai/WeeklyReviewDialog";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";

export function DashboardAICard() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [planMyDayOpen, setPlanMyDayOpen] = useState(false);
  const [weeklyReviewOpen, setWeeklyReviewOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate(`/assistant?q=${encodeURIComponent(prompt.trim())}`);
    } else {
      navigate("/assistant");
    }
  };

  return (
    <>
      <Card className="rounded-lg border-border/60 bg-card shadow-2xs">
        <CardHeader className="p-3 sm:p-3.5 pb-2 flex flex-row items-center justify-between border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <Bot className="size-3" />
            </div>
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                AetherMind AI
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </CardTitle>
            </div>
          </div>

          <Button
            variant="ghost"
            size="xs"
            onClick={() => navigate("/assistant")}
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground gap-1 -mr-1 h-6"
          >
            Open Chat
            <ArrowRight className="size-2.5" />
          </Button>
        </CardHeader>

        <CardContent className="p-3 sm:p-3.5 space-y-2.5">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Ask questions about your schedule, break down complex tasks, or plan focus blocks.
          </p>

          <form onSubmit={handleSubmit} className="relative">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask AetherMind anything or create a task..."
              className="h-8 text-xs pl-3 pr-8 bg-background border-border/70 focus-visible:ring-1"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 size-5 rounded bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors cursor-pointer"
              title="Send to Assistant"
            >
              <ArrowRight className="size-3" />
            </button>
          </form>

          <div className="space-y-1 pt-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Suggested Quick Actions
            </span>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setCreateTaskOpen(true)}
                className="flex items-center gap-1.5 p-1.5 rounded-md border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border text-left transition-all text-xs font-medium text-foreground cursor-pointer group"
              >
                <Plus className="size-3 text-primary shrink-0" />
                <span className="truncate group-hover:text-primary transition-colors text-[11px]">Create a task</span>
              </button>

              <button
                type="button"
                onClick={() => setPlanMyDayOpen(true)}
                className="flex items-center gap-1.5 p-1.5 rounded-md border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border text-left transition-all text-xs font-medium text-foreground cursor-pointer group"
              >
                <Sparkles className="size-3 text-amber-500 shrink-0" />
                <span className="truncate group-hover:text-amber-500 transition-colors text-[11px]">Plan my day</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/tasks")}
                className="flex items-center gap-1.5 p-1.5 rounded-md border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border text-left transition-all text-xs font-medium text-foreground cursor-pointer group"
              >
                <CalendarCheck className="size-3 text-blue-500 shrink-0" />
                <span className="truncate group-hover:text-blue-500 transition-colors text-[11px]">View all tasks</span>
              </button>

              <button
                type="button"
                onClick={() => setWeeklyReviewOpen(true)}
                className="flex items-center gap-1.5 p-1.5 rounded-md border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border text-left transition-all text-xs font-medium text-foreground cursor-pointer group"
              >
                <BarChart3 className="size-3 text-emerald-500 shrink-0" />
                <span className="truncate group-hover:text-emerald-500 transition-colors text-[11px]">Weekly review</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateTaskDialog open={createTaskOpen} onOpenChange={setCreateTaskOpen} />
      <PlanMyDayDialog open={planMyDayOpen} onOpenChange={setPlanMyDayOpen} />
      <WeeklyReviewDialog open={weeklyReviewOpen} onOpenChange={setWeeklyReviewOpen} />
    </>
  );
}

export default DashboardAICard;
