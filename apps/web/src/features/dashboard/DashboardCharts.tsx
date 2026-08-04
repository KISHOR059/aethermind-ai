import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

const PIE_COLORS = ["#10b981", "#f59e0b", "#f43f5e"]; // Completed (green), Pending (amber), Overdue (rose)
const BAR_COLORS = {
  LOW: "#64748b",
  MEDIUM: "#3b82f6",
  HIGH: "#f59e0b",
  URGENT: "#ef4444",
};

export function DashboardCharts({ stats }: DashboardChartsProps) {
  // 1. Task Status Pie Data
  const pieData = [
    { name: "Completed", value: stats.statusDistribution.completed },
    { name: "Pending", value: stats.statusDistribution.pending },
    { name: "Overdue", value: stats.statusDistribution.overdue },
  ].filter((item) => item.value > 0);

  // 2. Priority Bar Data
  const priorityData = [
    { priority: "Low", count: stats.taskPriorityDistribution.LOW, fill: BAR_COLORS.LOW },
    { priority: "Medium", count: stats.taskPriorityDistribution.MEDIUM, fill: BAR_COLORS.MEDIUM },
    { priority: "High", count: stats.taskPriorityDistribution.HIGH, fill: BAR_COLORS.HIGH },
    { priority: "Urgent", count: stats.taskPriorityDistribution.URGENT, fill: BAR_COLORS.URGENT },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 1. Weekly Completion Trend (Line Chart) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Weekly Completion Trend
          </CardTitle>
          <CardDescription className="text-xs">
            Completed vs pending tasks across weekdays
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.weeklyTrend}>
                <XAxis dataKey="day" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="pending"
                  name="Pending"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. Task Status Distribution (Pie Chart) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Task Status Distribution
          </CardTitle>
          <CardDescription className="text-xs">
            Proportion of completed, pending, and overdue tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full flex items-center justify-center">
            {pieData.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tasks available for analysis</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {pieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Priority Distribution (Bar Chart) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Priority Distribution
          </CardTitle>
          <CardDescription className="text-xs">
            Breakdown of tasks by urgency level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <XAxis dataKey="priority" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 4. Daily Productivity (Area Chart) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Daily Productivity & Focus Time
          </CardTitle>
          <CardDescription className="text-xs">
            Estimated focus duration (minutes) over recent days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyProductivity}>
                <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  name="Focus Mins"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary)/0.15)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardCharts;
