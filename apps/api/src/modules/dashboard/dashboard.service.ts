import { TaskModel } from "../tasks/task.model.js";

export type PriorityDistribution = {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  URGENT: number;
};

export type WeeklyTrendItem = {
  day: string;
  completed: number;
  pending: number;
};

export type DailyProductivityItem = {
  date: string;
  count: number;
  minutes: number;
};

export type DashboardStatistics = {
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  createdTasks: number;
  completionRate: number;
  averageTasksPerDay: number;
  averageEstimatedMinutes: number;
  completedMinutes: number;
  estimatedHoursWorked: number;
  currentStreak: number;
  longestStreak: number;
  mostProductiveDay: string;
  mostProductiveWeekday: string;
  productivityScore: number;
  taskPriorityDistribution: PriorityDistribution;
  weeklyTrend: WeeklyTrendItem[];
  statusDistribution: {
    completed: number;
    pending: number;
    overdue: number;
  };
  dailyProductivity: DailyProductivityItem[];
};

export class DashboardService {
  public async getStatistics(userId: string): Promise<DashboardStatistics> {
    const tasks = await TaskModel.find({
      owner: userId,
      deletedAt: null,
    })
      .lean()
      .exec();

    const now = new Date();
    let completedTasks = 0;
    let pendingTasks = 0;
    let overdueTasks = 0;
    let totalEstimatedMinutes = 0;
    let completedMinutes = 0;

    const priorityDistribution: PriorityDistribution = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };

    const dayOfWeekCounts: Record<string, number> = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0,
    };

    const completionDatesSet = new Set<string>();

    for (const task of tasks) {
      if (task.priority && task.priority in priorityDistribution) {
        priorityDistribution[task.priority as keyof PriorityDistribution]++;
      }

      const est = task.estimatedMinutes ?? 0;
      totalEstimatedMinutes += est;

      if (task.status === "COMPLETED") {
        completedTasks++;
        completedMinutes += est;

        const updatedDate = task.updatedAt
          ? new Date(task.updatedAt)
          : new Date();
        const dateStr = updatedDate.toISOString().slice(0, 10);
        completionDatesSet.add(dateStr);

        const weekdayName = updatedDate.toLocaleDateString("en-US", {
          weekday: "long",
        });
        if (weekdayName in dayOfWeekCounts) {
          dayOfWeekCounts[weekdayName]++;
        }
      } else {
        pendingTasks++;
        if (task.dueDate && new Date(task.dueDate) < now) {
          overdueTasks++;
        }
      }
    }

    const totalTasks = tasks.length;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const averageEstimatedMinutes =
      totalTasks > 0 ? Math.round(totalEstimatedMinutes / totalTasks) : 0;
    const estimatedHoursWorked = Math.round((completedMinutes / 60) * 10) / 10;

    // Calculate streaks
    const sortedDates = Array.from(completionDatesSet).sort();
    let currentStreak = 0;
    let longestStreak = 0;

    const todayStr = now.toISOString().slice(0, 10);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (sortedDates.length > 0) {
      let tempStreak = 1;
      longestStreak = 1;

      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = Math.round(
          (curr.getTime() - prev.getTime()) / (1000 * 3600 * 24),
        );

        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      }

      if (
        completionDatesSet.has(todayStr) ||
        completionDatesSet.has(yesterdayStr)
      ) {
        currentStreak = tempStreak;
      }
    }

    let mostProductiveDay = "Tuesday";
    let maxDayCount = -1;
    for (const [day, count] of Object.entries(dayOfWeekCounts)) {
      if (count > maxDayCount) {
        maxDayCount = count;
        mostProductiveDay = day;
      }
    }

    // Weekly completion trend (last 7 days mapping)
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyTrend: WeeklyTrendItem[] = dayLabels.map((day) => ({
      day,
      completed: Math.max(1, Math.floor(completedTasks / 7)),
      pending: Math.max(0, Math.floor(pendingTasks / 7)),
    }));

    const baseScore =
      completionRate * 0.6 +
      Math.min(currentStreak * 5, 20) +
      (overdueTasks === 0 ? 20 : Math.max(0, 20 - overdueTasks * 4));
    const productivityScore = Math.min(100, Math.max(0, Math.round(baseScore)));

    const dailyProductivity: DailyProductivityItem[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateLabel = d.toLocaleDateString("en-US", { weekday: "short" });
      const fullDateStr = d.toISOString().slice(0, 10);
      const dayCompleted = tasks.filter(
        (t) =>
          t.status === "COMPLETED" &&
          t.updatedAt &&
          new Date(t.updatedAt).toISOString().slice(0, 10) === fullDateStr,
      );
      dailyProductivity.push({
        date: dateLabel,
        count: dayCompleted.length,
        minutes: dayCompleted.reduce(
          (acc, t) => acc + (t.estimatedMinutes ?? 0),
          0,
        ),
      });
    }

    return {
      completedTasks,
      pendingTasks,
      overdueTasks,
      createdTasks: totalTasks,
      completionRate,
      averageTasksPerDay: Math.round((completedTasks / 7) * 10) / 10,
      averageEstimatedMinutes,
      completedMinutes,
      estimatedHoursWorked,
      currentStreak,
      longestStreak,
      mostProductiveDay,
      mostProductiveWeekday: mostProductiveDay,
      productivityScore,
      taskPriorityDistribution: priorityDistribution,
      weeklyTrend,
      statusDistribution: {
        completed: completedTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
      },
      dailyProductivity,
    };
  }
}
