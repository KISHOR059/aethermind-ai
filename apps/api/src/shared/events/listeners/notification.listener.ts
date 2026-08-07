import type { EventBus } from "../event-bus.js";
import {
  TASK_RESCHEDULE_REASON,
  type TaskEventMap,
} from "../task.events.js";
import { notificationService } from "../../../modules/notifications/index.js";
import {
  NotificationPriority,
  NotificationType,
} from "../../../modules/notifications/notification.types.js";

function mapTaskPriority(taskPriority: string): NotificationPriority {
  switch (taskPriority) {
    case "URGENT":
      return NotificationPriority.URGENT;
    case "HIGH":
      return NotificationPriority.HIGH;
    case "LOW":
      return NotificationPriority.LOW;
    default:
      return NotificationPriority.NORMAL;
  }
}

function formatMoveDate(date: Date, estimatedMinutes?: number | null): string {
  const hasTime =
    estimatedMinutes != null &&
    (date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0);

  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
  }).format(date);

  if (!hasTime) return day;

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return `${day} at ${time}`;
}

export function registerNotificationListener(
  eventBus: EventBus<TaskEventMap>,
): () => void {
  const unsubscribers = [
    eventBus.subscribe("task.created", (event) => {
      void notificationService.create(event.task.ownerId, {
        title: "Task Created",
        message: `You created task "${event.task.title}"`,
        type: NotificationType.TASK,
        priority: mapTaskPriority(event.task.priority),
        actionUrl: "/tasks",
        metadata: { taskId: event.task.taskId },
      });
    }),
    eventBus.subscribe("task.updated", (event) => {
      const isCompletionOnly =
        event.changedFields.length === 1 &&
        event.changedFields[0] === "status" &&
        event.task.status === "COMPLETED";

      if (isCompletionOnly) return;

      if (event.reason === TASK_RESCHEDULE_REASON) {
        if (!event.task.dueDate) return;

        void notificationService.create(event.task.ownerId, {
          title: "Task moved successfully",
          message: `${event.task.title} moved to ${formatMoveDate(
            event.task.dueDate,
            event.task.estimatedMinutes,
          )}.`,
          type: NotificationType.TASK,
          priority: NotificationPriority.NORMAL,
          actionUrl: "/calendar",
          metadata: {
            taskId: event.task.taskId,
            rescheduled: true,
            changedFields: event.changedFields,
          },
        });
        return;
      }

      void notificationService.create(event.task.ownerId, {
        title: "Task Updated",
        message: `Task "${event.task.title}" was updated`,
        type: NotificationType.TASK,
        priority: mapTaskPriority(event.task.priority),
        actionUrl: "/tasks",
        metadata: { taskId: event.task.taskId, changedFields: event.changedFields },
      });
    }),
    eventBus.subscribe("task.completed", (event) => {
      void notificationService.create(event.task.ownerId, {
        title: "Task Completed",
        message: `Task "${event.task.title}" has been completed!`,
        type: NotificationType.TASK,
        priority: NotificationPriority.NORMAL,
        actionUrl: "/tasks",
        metadata: { taskId: event.task.taskId },
      });
    }),
    eventBus.subscribe("task.deleted", (event) => {
      void notificationService.create(event.task.ownerId, {
        title: "Task Deleted",
        message: "A task was deleted",
        type: NotificationType.TASK,
        priority: NotificationPriority.LOW,
        actionUrl: "/tasks",
        metadata: { taskId: event.task.taskId },
      });
    }),
  ];

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}
