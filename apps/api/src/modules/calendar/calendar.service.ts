import type { Types } from "mongoose";

import {
  TaskModel,
  TaskPriority,
  TaskStatus,
} from "../tasks/task.model.js";
import type { PublicUser } from "../auth/auth.types.js";
import type { TaskService } from "../tasks/task.service.js";
import type { TaskRescheduleInput } from "../tasks/task.validation.js";
import {
  CalendarEventColor,
  CalendarView,
  type CalendarEvent,
  type CalendarRange,
} from "./calendar.types.js";
import type { CalendarQueryOutput } from "./calendar.validation.js";

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

type TaskEventSource = {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  estimatedMinutes?: number;
};

export type CalendarEventsResult = {
  events: CalendarEvent[];
  range: CalendarRange;
};

function isDateOnlyString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function endOfUtcDay(date: Date): Date {
  return new Date(startOfUtcDay(date).getTime() + DAY_MS - 1);
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfUtcMonth(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );
}

function startOfUtcWeek(date: Date): Date {
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return startOfUtcDay(new Date(date.getTime() - daysSinceMonday * DAY_MS));
}

function endOfUtcWeek(date: Date): Date {
  return new Date(startOfUtcWeek(date).getTime() + 7 * DAY_MS - 1);
}

function resolveStart(
  input: CalendarQueryOutput,
  view: CalendarView,
  now: Date,
): Date {
  if (input.startDate) {
    const parsed = new Date(input.startDate);
    return isDateOnlyString(input.startDate) ? startOfUtcDay(parsed) : parsed;
  }

  if (view === CalendarView.DAY) return startOfUtcDay(now);
  if (view === CalendarView.WEEK) return startOfUtcWeek(now);
  return startOfUtcMonth(now);
}

function resolveEnd(
  input: CalendarQueryOutput,
  view: CalendarView,
  start: Date,
): Date {
  if (input.endDate) {
    const parsed = new Date(input.endDate);
    return isDateOnlyString(input.endDate) ? endOfUtcDay(parsed) : parsed;
  }

  if (view === CalendarView.DAY) return endOfUtcDay(start);
  if (view === CalendarView.WEEK) return endOfUtcWeek(start);
  return endOfUtcMonth(start);
}

function getEventColor(status: TaskStatus, priority: TaskPriority): string {
  if (status === TaskStatus.COMPLETED) return CalendarEventColor.COMPLETED;

  switch (priority) {
    case TaskPriority.HIGH:
      return CalendarEventColor.HIGH;
    case TaskPriority.URGENT:
      return CalendarEventColor.URGENT;
    case TaskPriority.LOW:
      return CalendarEventColor.LOW;
    default:
      return CalendarEventColor.MEDIUM;
  }
}

function toCalendarEvent(task: TaskEventSource): CalendarEvent | null {
  if (!task.dueDate) return null;

  const start = task.dueDate;
  const end = task.estimatedMinutes
    ? new Date(start.getTime() + task.estimatedMinutes * MINUTE_MS)
    : start;

  return {
    id: task._id.toString(),
    taskId: task._id.toString(),
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    start: start.toISOString(),
    end: end.toISOString(),
    allDay: !task.estimatedMinutes,
    color: getEventColor(task.status, task.priority),
  };
}

export class CalendarService {
  public constructor(private readonly taskService: TaskService) {}

  /**
   * Applies a calendar drag-and-drop reschedule through the Task update
   * pipeline. The Task remains the single source of truth: only the task's
   * scheduling fields are mutated in MongoDB, and the rest of the system
   * (calendar, dashboard, notifications, AI context) converges via the
   * emitted domain events and React Query invalidation.
   */
  public async reschedule(
    user: PublicUser,
    input: TaskRescheduleInput,
  ): ReturnType<TaskService["reschedule"]> {
    return this.taskService.reschedule(user, input);
  }

  public async getEvents(
    userId: string,
    query: CalendarQueryOutput,
  ): Promise<CalendarEventsResult> {
    const view = query.view ?? CalendarView.MONTH;
    const now = new Date();
    const start = resolveStart(query, view, now);
    const end = resolveEnd(query, view, start);

    const tasks = await TaskModel.find({
      owner: userId,
      deletedAt: null,
      status:
        query.status && query.status !== TaskStatus.ARCHIVED
          ? query.status
          : { $ne: TaskStatus.ARCHIVED },
      ...(query.priority ? { priority: query.priority } : {}),
      dueDate: { $gte: start, $lte: end },
    })
      .select("_id title description status priority dueDate estimatedMinutes")
      .sort({ dueDate: 1 })
      .lean<TaskEventSource[]>()
      .exec();

    const events = tasks
      .map(toCalendarEvent)
      .filter((event): event is CalendarEvent => event !== null);

    return {
      events,
      range: {
        start: start.toISOString(),
        end: end.toISOString(),
        view,
      },
    };
  }
}
