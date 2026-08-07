export enum NotificationType {
  TASK = "TASK",
  AI = "AI",
  SYSTEM = "SYSTEM",
  PRODUCTIVITY = "PRODUCTIVITY",
  REMINDER = "REMINDER",
}

export enum NotificationPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export type NotificationMetadata = Record<string, unknown>;
