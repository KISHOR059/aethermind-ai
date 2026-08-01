import { logger } from "../../../lib/logger.js";
import type { EventBus } from "../event-bus.js";
import type { TaskEventMap } from "../task.events.js";

export function registerNotificationListener(
  eventBus: EventBus<TaskEventMap>,
): () => void {
  const unsubscribe = eventBus.subscribe("task.completed", (event) => {
    logger.info("Notification: task completed", { taskId: event.task.taskId });
  });

  return unsubscribe;
}
