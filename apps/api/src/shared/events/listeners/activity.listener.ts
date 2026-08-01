import { logger } from "../../../lib/logger.js";
import type { EventBus } from "../event-bus.js";
import type { TaskEventMap } from "../task.events.js";

export function registerActivityListener(eventBus: EventBus<TaskEventMap>): () => void {
  const unsubscribers = [
    eventBus.subscribe("task.created", (event) => {
      logger.info("Activity: task created", { taskId: event.task.taskId });
    }),
    eventBus.subscribe("task.updated", (event) => {
      logger.info("Activity: task updated", {
        taskId: event.task.taskId,
        changedFields: event.changedFields,
      });
    }),
    eventBus.subscribe("task.completed", (event) => {
      logger.info("Activity: task completed", { taskId: event.task.taskId });
    }),
    eventBus.subscribe("task.deleted", (event) => {
      logger.info("Activity: task deleted", { taskId: event.task.taskId });
    }),
  ];

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}
