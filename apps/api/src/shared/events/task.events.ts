import { randomUUID } from "node:crypto";

import type { DomainEvent } from "./domain-event.js";

export const TASK_EVENT_TYPES = {
  CREATED: "task.created",
  UPDATED: "task.updated",
  COMPLETED: "task.completed",
  DELETED: "task.deleted",
} as const;

export type TaskEventData = {
  taskId: string;
  ownerId: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: Date;
};

export type DeletedTaskEventData = {
  taskId: string;
  ownerId: string;
};

abstract class BaseTaskEvent<TType extends string> implements DomainEvent {
  public readonly id: string;
  public readonly occurredAt: Date;
  public readonly type: TType;

  protected constructor(type: TType) {
    this.id = randomUUID();
    this.type = type;
    this.occurredAt = new Date();
  }
}

export class TaskCreatedEvent extends BaseTaskEvent<typeof TASK_EVENT_TYPES.CREATED> {
  public constructor(public readonly task: TaskEventData) {
    super(TASK_EVENT_TYPES.CREATED);
  }
}

export class TaskUpdatedEvent extends BaseTaskEvent<typeof TASK_EVENT_TYPES.UPDATED> {
  public constructor(
    public readonly task: TaskEventData,
    public readonly changedFields: readonly string[],
  ) {
    super(TASK_EVENT_TYPES.UPDATED);
  }
}

export class TaskCompletedEvent extends BaseTaskEvent<typeof TASK_EVENT_TYPES.COMPLETED> {
  public constructor(public readonly task: TaskEventData) {
    super(TASK_EVENT_TYPES.COMPLETED);
  }
}

export class TaskDeletedEvent extends BaseTaskEvent<typeof TASK_EVENT_TYPES.DELETED> {
  public constructor(public readonly task: DeletedTaskEventData) {
    super(TASK_EVENT_TYPES.DELETED);
  }
}

export interface TaskEventMap {
  "task.created": TaskCreatedEvent;
  "task.updated": TaskUpdatedEvent;
  "task.completed": TaskCompletedEvent;
  "task.deleted": TaskDeletedEvent;
}
