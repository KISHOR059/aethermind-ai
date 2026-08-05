import { Sparkles } from "lucide-react";

import CreateTaskDialog from "@/features/tasks/CreateTaskDialog";
import PlanMyDayDialog from "@/features/ai/PlanMyDayDialog";
import { Card, CardContent } from "@/shared/components/ui/card";

export function DashboardEmptyState() {
  return (
    <Card className="border-dashed border-2 border-border/80 bg-gradient-to-b from-card to-muted/20 my-6">
      <CardContent className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-5 max-w-md mx-auto">
        <div className="relative flex items-center justify-center">
          <div className="absolute size-16 animate-ping rounded-full bg-primary/10" />
          <div className="relative size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <Sparkles className="size-7 animate-pulse text-primary" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            No tasks yet
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Welcome to your AetherMind dashboard! Get started by adding your first task or using AI to plan your workday.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <CreateTaskDialog />
          <PlanMyDayDialog />
        </div>
      </CardContent>
    </Card>
  );
}

export default DashboardEmptyState;
