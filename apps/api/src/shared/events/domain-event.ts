export interface DomainEvent {
  readonly id: string;
  readonly type: string;
  readonly occurredAt: Date;
}

export type DomainEventMap = Record<string, DomainEvent>;

export type EventHandler<TEvent extends DomainEvent> = (
  event: TEvent,
) => void | Promise<void>;
