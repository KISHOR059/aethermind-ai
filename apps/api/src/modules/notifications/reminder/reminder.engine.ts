import { NotificationModel } from "../notification.model.js";
import {
  NotificationPriority,
  NotificationType,
} from "../notification.types.js";
import { TaskModel, TaskStatus } from "../../tasks/task.model.js";
import { UserModel } from "../../auth/user.model.js";
import { logger } from "../../../lib/logger.js";

type ReminderNotificationData = {
  title: string;
  message: string;
  priority?: NotificationPriority;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function isMonday(date: Date): boolean {
  return date.getDay() === 1;
}

function daysSinceMonday(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

async function hasExistingReminder(
  id: string,
  userId: string,
): Promise<boolean> {
  const existing = await NotificationModel.findOne({
    userId,
    type: NotificationType.REMINDER,
    "metadata.reminderId": id,
  }).lean().exec();
  return existing !== null;
}

async function createReminderNotification(
  id: string,
  userId: string,
  notification: ReminderNotificationData,
): Promise<void> {
  if (await hasExistingReminder(id, userId)) return;

  await NotificationModel.create({
    userId,
    ...notification,
    type: NotificationType.REMINDER,
    metadata: {
      ...notification.metadata,
      reminderId: id,
      createdAt: new Date().toISOString(),
    },
  });

  logger.info("Reminder notification created", {
    reminderId: id,
    userId,
    title: notification.title,
  });
}

async function getActiveUserIds(): Promise<string[]> {
  const users = await UserModel.find({ isActive: true })
    .select("_id")
    .lean()
    .exec();
  return users.map((u) => u._id.toString());
}

export async function checkOverdueTasks(): Promise<void> {
  const userIds = await getActiveUserIds();
  const now = new Date();

  for (const userId of userIds) {
    const overdueTasks = await TaskModel.find({
      owner: userId,
      status: { $in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
      dueDate: { $lt: startOfDay(now) },
      deletedAt: null,
    }).lean().exec();

    if (overdueTasks.length === 0) continue;

    const today = now.toISOString().slice(0, 10);
    const id = `overdue-${userId}-${today}`;

    const titles = overdueTasks.slice(0, 3).map((t) => `"${t.title}"`);
    const summary = overdueTasks.length <= 3
      ? titles.join(", ")
      : `${titles.join(", ")} and ${overdueTasks.length - 3} more`;

    await createReminderNotification(id, userId, {
      title: `${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? "s" : ""}`,
      message: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""}: ${summary}`,
      priority: overdueTasks.length >= 5 ? NotificationPriority.URGENT : NotificationPriority.HIGH,
      actionUrl: "/tasks",
      metadata: {
        category: "overdue",
        count: overdueTasks.length,
        taskIds: overdueTasks.map((t) => t._id.toString()),
      },
    });
  }
}

export async function checkDueTodayTasks(): Promise<void> {
  const userIds = await getActiveUserIds();
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  for (const userId of userIds) {
    const tasks = await TaskModel.find({
      owner: userId,
      status: { $in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
      dueDate: { $gte: todayStart, $lte: todayEnd },
      deletedAt: null,
    }).lean().exec();

    if (tasks.length === 0) continue;

    const today = now.toISOString().slice(0, 10);
    const id = `due-today-${userId}-${today}`;

    const titles = tasks.slice(0, 3).map((t) => `"${t.title}"`);
    const summary = tasks.length <= 3
      ? titles.join(", ")
      : `${titles.join(", ")} and ${tasks.length - 3} more`;

    await createReminderNotification(id, userId, {
      title: `${tasks.length} Task${tasks.length > 1 ? "s" : ""} Due Today`,
      message: `You have ${tasks.length} task${tasks.length > 1 ? "s" : ""} due today: ${summary}`,
      priority: tasks.some((t) => t.priority === "URGENT" || t.priority === "HIGH")
        ? NotificationPriority.HIGH
        : NotificationPriority.NORMAL,
      actionUrl: "/tasks",
      metadata: {
        category: "due-today",
        count: tasks.length,
        taskIds: tasks.map((t) => t._id.toString()),
      },
    });
  }
}

export async function checkDueTomorrowTasks(): Promise<void> {
  const userIds = await getActiveUserIds();
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStart = startOfDay(tomorrow);
  const tomorrowEnd = endOfDay(tomorrow);

  for (const userId of userIds) {
    const tasks = await TaskModel.find({
      owner: userId,
      status: { $in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
      dueDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
      deletedAt: null,
    }).lean().exec();

    if (tasks.length === 0) continue;

    const tomorrowDate = tomorrow.toISOString().slice(0, 10);
    const id = `due-tomorrow-${userId}-${tomorrowDate}`;

    const titles = tasks.slice(0, 3).map((t) => `"${t.title}"`);
    const summary = tasks.length <= 3
      ? titles.join(", ")
      : `${titles.join(", ")} and ${tasks.length - 3} more`;

    await createReminderNotification(id, userId, {
      title: `${tasks.length} Task${tasks.length > 1 ? "s" : ""} Due Tomorrow`,
      message: `You have ${tasks.length} task${tasks.length > 1 ? "s" : ""} due tomorrow: ${summary}`,
      priority: tasks.some((t) => t.priority === "URGENT" || t.priority === "HIGH")
        ? NotificationPriority.NORMAL
        : NotificationPriority.LOW,
      actionUrl: "/tasks",
      metadata: {
        category: "due-tomorrow",
        count: tasks.length,
        taskIds: tasks.map((t) => t._id.toString()),
      },
    });
  }
}

export async function checkWeeklyReviewAvailability(): Promise<void> {
  const userIds = await getActiveUserIds();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  if (!isMonday(now) && now.getDay() !== 0) return;

  for (const userId of userIds) {
    const id = `weekly-review-${userId}-${today}`;

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - daysSinceMonday(now));
    weekStart.setHours(0, 0, 0, 0);

    const completedThisWeek = await TaskModel.countDocuments({
      owner: userId,
      status: TaskStatus.COMPLETED,
      completedAt: { $gte: weekStart },
      deletedAt: null,
    }).exec();

    const pendingTasks = await TaskModel.countDocuments({
      owner: userId,
      status: { $in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
      deletedAt: null,
    }).exec();

    if (completedThisWeek === 0 && pendingTasks === 0) continue;

    await createReminderNotification(id, userId, {
      title: "Weekly Review Available",
      message: `You completed ${completedThisWeek} task${completedThisWeek !== 1 ? "s" : ""} this week with ${pendingTasks} pending. Time for a weekly review!`,
      priority: NotificationPriority.NORMAL,
      actionUrl: "/tasks",
      metadata: {
        category: "weekly-review",
        completedThisWeek,
        pendingTasks,
      },
    });
  }
}

export async function checkProductivityMilestones(): Promise<void> {
  const userIds = await getActiveUserIds();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - daysSinceMonday(now));
  weekStart.setHours(0, 0, 0, 0);

  for (const userId of userIds) {
    const completedThisWeek = await TaskModel.countDocuments({
      owner: userId,
      status: TaskStatus.COMPLETED,
      completedAt: { $gte: weekStart },
      deletedAt: null,
    }).exec();

    const milestones = [5, 10, 15, 20, 25, 50, 100];

    for (const milestone of milestones) {
      if (completedThisWeek !== milestone) continue;

      const id = `milestone-${userId}-${milestone}-${today}`;

      await createReminderNotification(id, userId, {
        title: `Productivity Milestone: ${milestone} Tasks!`,
        message: `Congratulations! You've completed ${milestone} tasks this week. Keep up the great work!`,
        priority: milestone >= 20 ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
        actionUrl: "/dashboard",
        metadata: {
          category: "milestone",
          milestone,
          completedThisWeek,
        },
      });
    }
  }
}

export async function runAllReminderChecks(): Promise<void> {
  logger.info("Starting reminder engine checks");

  const checks = [
    { name: "overdue-tasks", fn: checkOverdueTasks },
    { name: "due-today-tasks", fn: checkDueTodayTasks },
    { name: "due-tomorrow-tasks", fn: checkDueTomorrowTasks },
    { name: "weekly-review", fn: checkWeeklyReviewAvailability },
    { name: "productivity-milestones", fn: checkProductivityMilestones },
  ];

  for (const check of checks) {
    try {
      await check.fn();
      logger.debug(`Reminder check completed: ${check.name}`);
    } catch (error) {
      logger.error(`Reminder check failed: ${check.name}`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  logger.info("Reminder engine checks completed");
}
