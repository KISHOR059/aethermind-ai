import type { Notification, NotificationType } from "./notification.types";

const PERMISSION_KEY = "notification-permission-requested";

export type BrowserNotificationPermission = "granted" | "denied" | "default";

export function getNotificationPermission(): BrowserNotificationPermission {
  if (typeof Notification === "undefined") return "denied";
  return Notification.permission as BrowserNotificationPermission;
}

export async function requestNotificationPermission(): Promise<BrowserNotificationPermission> {
  if (typeof Notification === "undefined") return "denied";

  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";

  const result = await Notification.requestPermission();
  localStorage.setItem(PERMISSION_KEY, "true");
  return result as BrowserNotificationPermission;
}

export function shouldShowBrowserNotification(notification: Notification): boolean {
  if (getNotificationPermission() !== "granted") return false;
  if (notification.isRead) return false;

  if (notification.priority === "HIGH" || notification.priority === "URGENT") return true;

  if (notification.type === "TASK") {
    const title = notification.title.toLowerCase();
    const message = notification.message.toLowerCase();

    if (title.includes("overdue") || message.includes("overdue")) return true;
    if (title.includes("due soon") || message.includes("due soon")) return true;
    if (title.includes("due today") || message.includes("due today")) return true;
  }

  if (notification.type === "AI") {
    const title = notification.title.toLowerCase();
    const message = notification.message.toLowerCase();

    if (title.includes("weekly review") || message.includes("weekly review")) return true;
    if (title.includes("daily plan") || message.includes("daily plan")) return true;
    if (title.includes("plan my day") || message.includes("plan my day")) return true;
  }

  return false;
}

export function showBrowserNotification(notification: Notification): void {
  if (!shouldShowBrowserNotification(notification)) return;

  try {
    const browserNotification = new window.Notification(notification.title, {
      body: notification.message,
      tag: notification.id,
      requireInteraction: false,
    });

    browserNotification.onclick = () => {
      window.focus();
      browserNotification.close();

      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
    };

    setTimeout(() => browserNotification.close(), 8000);
  } catch {
    // Browser notifications not supported or blocked
  }
}

const TYPE_TOAST_MAP: Record<NotificationType, "info" | "success" | "warning" | "error"> = {
  TASK: "info",
  AI: "success",
  SYSTEM: "warning",
  PRODUCTIVITY: "success",
  REMINDER: "info",
};

export function getToastType(notification: Notification): "info" | "success" | "warning" | "error" {
  if (notification.priority === "URGENT") return "error";
  if (notification.priority === "HIGH") return "warning";
  return TYPE_TOAST_MAP[notification.type] ?? "info";
}
