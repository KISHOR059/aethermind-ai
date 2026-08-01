# Domain Event Flow

AetherMind uses an in-process, typed event bus for decoupling domain work from
future side effects. It is intentionally local to the API process; there is no
queue, broker, Redis dependency, or database-backed event store.

## Flow

```text
HTTP request
  -> authenticated controller
  -> task service
  -> repository mutation
  -> eventBus.publish(domain event)
  -> isolated listeners
       -> Activity listener
       -> Analytics listener
       -> Notification listener
```

Task events are published only after the repository operation succeeds:

- `task.created`
- `task.updated`
- `task.completed`
- `task.deleted`

`TaskCompletedEvent` is emitted only when a task transitions into `COMPLETED`.
Deleted tasks emit an event after their soft-delete mutation succeeds.

## Failure isolation

The bus invokes handlers independently. Synchronous exceptions and rejected
promises are caught and logged with the event ID and type. They do not reject
the publishing service call or change the HTTP response.

## Typed subscriptions

```ts
const unsubscribe = eventBus.subscribe("task.completed", (event) => {
  event.task.taskId;
});

eventBus.once("task.created", handler);
eventBus.unsubscribe("task.completed", handler);
unsubscribe();
```
