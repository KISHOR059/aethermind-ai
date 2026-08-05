import { TaskModel, TaskStatus } from "../tasks/task.model.js";

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
  totalTasks: number;
  createdTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  highPriorityTasks: number;
  tasksDueToday: number;
  tasksDueThisWeek: number;
  tasksFinishedToday: number;
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
    inProgress: number;
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

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    const dayOfWeek = now.getDay();
    const distToMon = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - distToMon,
    );
    const endOfWeek = new Date(
      startOfWeek.getFullYear(),
      startOfWeek.getMonth(),
      startOfWeek.getDate() + 6,
      23,
      59,
      59,
      999,
    );

    let completedTasks = 0;
    let pendingTasks = 0;
    let inProgressTasks = 0;
    let overdueTasks = 0;
    let highPriorityTasks = 0;
    let tasksDueToday = 0;
    let tasksDueThisWeek = 0;
    let tasksFinishedToday = 0;
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

      if (task.priority === "HIGH" || task.priority === "URGENT") {
        highPriorityTasks++;
      }

      const est = task.estimatedMinutes ?? 0;
      totalEstimatedMinutes += est;

      const taskDueDate = task.dueDate ? new Date(task.dueDate) : null;

      if (task.status === TaskStatus.COMPLETED) {
        completedTasks++;
        completedMinutes += est;

        const compDate = task.completedAt
          ? new Date(task.completedAt)
          : task.updatedAt
          ? new Date(task.updatedAt)
          : new Date();
        const dateStr = compDate.toISOString().slice(0, 10);
        completionDatesSet.add(dateStr);

        if (compDate >= startOfToday && compDate <= endOfToday) {
          tasksFinishedToday++;
        }

        const weekdayName = compDate.toLocaleDateString("en-US", {
          weekday: "long",
        });
        if (weekdayName in dayOfWeekCounts) {
          dayOfWeekCounts[weekdayName]++;
        }
      } else {
        if (task.status === TaskStatus.IN_PROGRESS) {
          inProgressTasks++;
        } else {
          pendingTasks++;
        }

        if (taskDueDate) {
          if (taskDueDate < now) {
            overdueTasks++;
          }
          if (taskDueDate >= startOfToday && taskDueDate <= endOfToday) {
            tasksDueToday++;
          }
          if (taskDueDate >= startOfWeek && taskDueDate <= endOfWeek) {
            tasksDueThisWeek++;
          }
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

    let mostProductiveDay = "N/A";
    let maxDayCount = 0;
    for (const [day, count] of Object.entries(dayOfWeekCounts)) {
      if (count > maxDayCount) {
        maxDayCount = count;
        mostProductiveDay = day;
      }
    }

    // Weekly completion trend (last 7 days mapping with real database values)
    const weeklyTrend: WeeklyTrendItem[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dateStr = d.toISOString().slice(0, 10);

      const completedOnDay = tasks.filter((t) => {
        if (t.status !== TaskStatus.COMPLETED) return false;
        const cDate = t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt);
        return cDate.toISOString().slice(0, 10) === dateStr;
      }).length;

      const pendingOnDay = tasks.filter((t) => {
        if (t.status === TaskStatus.COMPLETED) return false;
        const crDate = t.createdAt ? new Date(t.createdAt) : new Date();
        return crDate.toISOString().slice(0, 10) <= dateStr;
      }).length;

      weeklyTrend.push({
        day: dayName,
        completed: completedOnDay,
        pending: pendingOnDay,
      });
    }

    let productivityScore = 0;
    if (totalTasks > 0) {
      const baseScore =
        completionRate * 0.5 +
        Math.min(currentStreak * 5, 25) +
        (overdueTasks === 0 ? 25 : Math.max(0, 25 - overdueTasks * 5));
      productivityScore = Math.min(100, Math.max(0, Math.round(baseScore)));
    }

    const dailyProductivity: DailyProductivityItem[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateLabel = d.toLocaleDateString("en-US", { weekday: "short" });
      const fullDateStr = d.toISOString().slice(0, 10);
      const dayCompleted = tasks.filter((t) => {
        if (t.status !== TaskStatus.COMPLETED) return false;
        const cDate = t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt);
        return cDate.toISOString().slice(0, 10) === fullDateStr;
      });

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
      totalTasks,
      createdTasks: totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      highPriorityTasks,
      tasksDueToday,
      tasksDueThisWeek,
      tasksFinishedToday,
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
        inProgress: inProgressTasks,
        overdue: overdueTasks,
      },
      dailyProductivity,
    };
  }
}

