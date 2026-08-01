import {
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  FileText,
} from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";

function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Overview</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Good morning, Alex</h1>
        <p className="mt-2 text-muted-foreground">Here&apos;s what&apos;s happening across your workspace.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Today&apos;s Tasks</CardTitle>
              <CardDescription className="mt-1">Your focus for today</CardDescription>
            </div>
            <CheckCircle2 className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">8</p>
            <p className="mt-1 text-sm text-muted-foreground">3 completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>AI Suggestions</CardTitle>
              <CardDescription className="mt-1">Ideas to improve your day</CardDescription>
            </div>
            <Bot className="size-5 text-primary" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Prioritize deep work</span>
              <Badge variant="secondary">New</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span>Review weekly goals</span>
              <Badge variant="outline">2 min</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Recent Notes</CardTitle>
              <CardDescription className="mt-1">Your latest thoughts</CardDescription>
            </div>
            <FileText className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-20">
              <div className="space-y-3 text-sm">
                <p>Product vision and priorities</p>
                <Separator />
                <p>Ideas for the next sprint</p>
                <Separator />
                <p>Meeting notes</p>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Calendar</CardTitle>
              <CardDescription className="mt-1">Your next commitment</CardDescription>
            </div>
            <CalendarDays className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="font-medium">Design review</p>
            <p className="mt-1 text-sm text-muted-foreground">Today at 2:00 PM</p>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Analytics</CardTitle>
              <CardDescription className="mt-1">A snapshot of your progress</CardDescription>
            </div>
            <BarChart3 className="size-5 text-primary" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-2xl font-semibold">72%</p>
                <p className="text-sm text-muted-foreground">Weekly focus</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">14</p>
                <p className="text-sm text-muted-foreground">Tasks completed</p>
              </div>
              <div>
                <Skeleton className="h-8 w-16" />
                <p className="mt-1 text-sm text-muted-foreground">New insights soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
