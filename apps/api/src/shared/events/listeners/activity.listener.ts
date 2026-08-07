import type { EventBus } from "../event-bus.js";
import type { TaskEventMap } from "../task.events.js";
import { activityService } from "../../../modules/activity/index.js";

export function registerActivityListener(eventBus: EventBus<TaskEventMap>): () => void {
  const unsubscribers = [
    eventBus.subscribe("task.created", (event) => {
      void activityService.logActivity({
        ownerId: event.task.ownerId,
        taskId: event.task.taskId,
        taskTitle: event.task.title,
        action: "created",
        metadata: { priority: event.task.priority, dueDate: event.task.dueDate },
      });
    }),
    eventBus.subscribe("task.updated", (event) => {
      void activityService.logActivity({
        ownerId: event.task.ownerId,
        taskId: event.task.taskId,
        taskTitle: event.task.title,
        action: "updated",
        metadata: { changedFields: event.changedFields },
      });
    }),
    eventBus.subscribe("task.completed", (event) => {
      void activityService.logActivity({
        ownerId: event.task.ownerId,
        taskId: event.task.taskId,
        taskTitle: event.task.title,
        action: "completed",
        metadata: { priority: event.task.priority },
      });
    }),
    eventBus.subscribe("task.deleted", (event) => {
      void activityService.logActivity({
        ownerId: event.task.ownerId,
        taskId: event.task.taskId,
        taskTitle: event.task.taskId,
        action: "deleted",
      });
    }),
  ];

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}
