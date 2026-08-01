import { randomUUID } from "node:crypto";

import { logger } from "../../lib/logger.js";
import type { DomainEvent, EventHandler } from "./domain-event.js";

type RegisteredHandler = {
  handler: EventHandler<DomainEvent>;
  once: boolean;
};

export class EventBus<
  TEvents extends { [TKey in keyof TEvents]: DomainEvent },
> {
  private readonly handlers = new Map<keyof TEvents, Set<RegisteredHandler>>();

  public subscribe<TKey extends keyof TEvents>(
    type: TKey,
    handler: EventHandler<TEvents[TKey]>,
  ): () => void {
    const registeredHandler: RegisteredHandler = {
      handler: handler as EventHandler<DomainEvent>,
      once: false,
    };
    const handlers = this.handlers.get(type) ?? new Set<RegisteredHandler>();

    handlers.add(registeredHandler);
    this.handlers.set(type, handlers);

    return () => this.removeHandler(type, registeredHandler);
  }

  public once<TKey extends keyof TEvents>(
    type: TKey,
    handler: EventHandler<TEvents[TKey]>,
  ): () => void {
    const unsubscribe = this.subscribe(type, handler);
    const handlers = this.handlers.get(type);
    const registeredHandler = [...(handlers ?? [])].find(
      (item) => item.handler === handler,
    );

    if (registeredHandler) {
      registeredHandler.once = true;
    }

    return unsubscribe;
  }

  public unsubscribe<TKey extends keyof TEvents>(
    type: TKey,
    handler: EventHandler<TEvents[TKey]>,
  ): void {
    const handlers = this.handlers.get(type);
    const registeredHandler = [...(handlers ?? [])].find(
      (item) => item.handler === handler,
    );

    if (registeredHandler) {
      this.removeHandler(type, registeredHandler);
    }
  }

  public publish<TKey extends keyof TEvents>(event: TEvents[TKey]): void {
    const handlers = [...(this.handlers.get(event.type as TKey) ?? [])];

    for (const registeredHandler of handlers) {
      if (registeredHandler.once) {
        this.removeHandler(event.type as TKey, registeredHandler);
      }

      try {
        const result = registeredHandler.handler(event);

        if (result instanceof Promise) {
          void result.catch((error: unknown) =>
            this.logHandlerFailure(event, error),
          );
        }
      } catch (error) {
        this.logHandlerFailure(event, error);
      }
    }
  }

  private removeHandler<TKey extends keyof TEvents>(
    type: TKey,
    registeredHandler: RegisteredHandler,
  ): void {
    const handlers = this.handlers.get(type);

    if (!handlers) {
      return;
    }

    handlers.delete(registeredHandler);

    if (handlers.size === 0) {
      this.handlers.delete(type);
    }
  }

  private logHandlerFailure(event: TEvents[keyof TEvents], error: unknown): void {
    logger.error("Domain event handler failed", {
      eventId: event.id || randomUUID(),
      eventType: event.type,
      error: error instanceof Error ? error.message : "Unknown handler error",
    });
  }
}
