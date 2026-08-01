import { eventBus } from "../index.js";
import { registerActivityListener } from "./activity.listener.js";
import { registerAnalyticsListener } from "./analytics.listener.js";
import { registerNotificationListener } from "./notification.listener.js";

export function registerEventListeners(): () => void {
  const unsubscribeActivity = registerActivityListener(eventBus);
  const unsubscribeAnalytics = registerAnalyticsListener(eventBus);
  const unsubscribeNotifications = registerNotificationListener(eventBus);

  return () => {
    unsubscribeActivity();
    unsubscribeAnalytics();
    unsubscribeNotifications();
  };
}
