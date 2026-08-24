import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Clock3,
  Layers,
  PieChart as PieIcon,
  TrendingUp,
} from "lucide-react";

import type { DashboardStatistics } from "./dashboard.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export interface DashboardChartsProps {
  stats: DashboardStatistics;
}

const STATUS_COLORS = {
  Completed: "#10b981", // emerald
  Pending: "#f59e0b", // amber
  "In Progress": "#6366f1", // indigo
  Overdue: "#f43f5e", // rose
};

const PRIORITY_COLORS = {
  Low: "#64748b",
  Medium: "#3b82f6",
  High: "#f59e0b",
  Urgent: "#ef4444",
};

export function DashboardCharts({ stats }: DashboardChartsProps) {
  const statusPieData = [
    { name: "Completed", value: stats.statusDistribution.completed, fill: STATUS_COLORS.Completed },
    { name: "Pending", value: stats.statusDistribution.pending, fill: STATUS_COLORS.Pending },
    { name: "In Progress", value: stats.statusDistribution.inProgress, fill: STATUS_COLORS["In Progress"] },
    { name: "Overdue", value: stats.statusDistribution.overdue, fill: STATUS_COLORS.Overdue },
  ].filter((item) => item.value > 0);

  const priorityData = [
    { priority: "Low", count: stats.taskPriorityDistribution.LOW, fill: PRIORITY_COLORS.Low },
    { priority: "Medium", count: stats.taskPriorityDistribution.MEDIUM, fill: PRIORITY_COLORS.Medium },
    { priority: "High", count: stats.taskPriorityDistribution.HIGH, fill: PRIORITY_COLORS.High },
    { priority: "Urgent", count: stats.taskPriorityDistribution.URGENT, fill: PRIORITY_COLORS.Urgent },
  ];

  const totalPriorityTasks = priorityData.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="grid gap-3.5 md:grid-cols-2">
      {/* 1. Task Completion Trend (Area Chart) */}
      <Card className="rounded-lg border-border/60 bg-card shadow-2xs hover:border-border transition-colors">
        <CardHeader className="p-3.5 sm:p-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <TrendingUp className="size-3.5" />
            </div>
            <CardTitle className="text-xs font-bold tracking-tight text-foreground">
              Task Completion Trend
            </CardTitle>
          </div>
          <CardDescription className="text-[11px]">
            Daily completion momentum over recent days
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3.5 sm:p-4 pt-0">
          <div className="h-52 w-full">
            {stats.dailyProductivity.every((d) => d.count === 0 && d.minutes === 0) ? (
              <EmptyChartState message="No task completion history recorded yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.dailyProductivity}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Tasks Completed"
                    stroke="#10b981"
                    fill="url(#colorTrend)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Tasks by Status (Donut / Pie Chart) */}
      <Card className="rounded-lg border-border/60 bg-card shadow-2xs hover:border-border transition-colors">
        <CardHeader className="p-3.5 sm:p-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <PieIcon className="size-3.5" />
            </div>
            <CardTitle className="text-xs font-bold tracking-tight text-foreground">
              Tasks by Status
            </CardTitle>
          </div>
          <CardDescription className="text-[11px]">
            Distribution across completed, pending, in progress, and overdue
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3.5 sm:p-4 pt-0">
          <div className="h-52 w-full flex items-center justify-center">
            {statusPieData.length === 0 ? (
              <EmptyChartState message="No task data available for status distribution" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Weekly Activity (Bar Chart) */}
      <Card className="rounded-lg border-border/60 bg-card shadow-2xs hover:border-border transition-colors">
        <CardHeader className="p-3.5 sm:p-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500">
              <BarChart3 className="size-3.5" />
            </div>
            <CardTitle className="text-xs font-bold tracking-tight text-foreground">
              Weekly Activity
            </CardTitle>
          </div>
          <CardDescription className="text-[11px]">
            Comparison of completed vs pending tasks across weekdays
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3.5 sm:p-4 pt-0">
          <div className="h-52 w-full">
            {stats.weeklyTrend.every((w) => w.completed === 0 && w.pending === 0) ? (
              <EmptyChartState message="No weekly activity recorded yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyTrend}>
                  <XAxis dataKey="day" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                  <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. Priority Distribution (Bar Chart) */}
      <Card className="rounded-lg border-border/60 bg-card shadow-2xs hover:border-border transition-colors">
        <CardHeader className="p-3.5 sm:p-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <Layers className="size-3.5" />
            </div>
            <CardTitle className="text-xs font-bold tracking-tight text-foreground">
              Priority Distribution
            </CardTitle>
          </div>
          <CardDescription className="text-[11px]">
            Breakdown of tasks by urgency level
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3.5 sm:p-4 pt-0">
          <div className="h-52 w-full">
            {totalPriorityTasks === 0 ? (
              <EmptyChartState message="No tasks created to analyze priority distribution" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <XAxis dataKey="priority" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Tasks" radius={[3, 3, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string | number;
    value?: string | number;
    color?: string;
    fill?: string;
  }>;
  label?: string | number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-popover/95 p-2.5 shadow-md backdrop-blur-xs text-xs space-y-1">
        {label && <p className="font-semibold text-popover-foreground">{label}</p>}
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-bold text-popover-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center space-y-2 text-center p-4 border border-dashed rounded-xl bg-muted/20">
      <Clock3 className="size-5 text-muted-foreground/60" />
      <p className="text-xs text-muted-foreground max-w-xs">{message}</p>
    </div>
  );
}

export default DashboardCharts;
