import { EventBus } from "./event-bus.js";
import type { DomainEvent, EventHandler } from "./domain-event.js";
import type { TaskEventMap } from "./task.events.js";

export const eventBus = new EventBus<TaskEventMap>();

export type { DomainEvent, EventHandler };
export { EventBus } from "./event-bus.js";
export {
  TASK_EVENT_TYPES,
  TaskCompletedEvent,
  TaskCreatedEvent,
  TaskDeletedEvent,
  TaskUpdatedEvent,
} from "./task.events.js";
export type {
  DeletedTaskEventData,
  TaskEventData,
  TaskEventMap,
} from "./task.events.js";
