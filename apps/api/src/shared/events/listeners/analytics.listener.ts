import { logger } from "../../../lib/logger.js";
import type { EventBus } from "../event-bus.js";
import type { TaskEventMap } from "../task.events.js";

export function registerAnalyticsListener(eventBus: EventBus<TaskEventMap>): () => void {
  const unsubscribers = [
    eventBus.subscribe("task.created", (event) => {
      logger.info("Analytics: task created", { taskId: event.task.taskId });
    }),
    eventBus.subscribe("task.completed", (event) => {
      logger.info("Analytics: task completed", { taskId: event.task.taskId });
    }),
  ];

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}
