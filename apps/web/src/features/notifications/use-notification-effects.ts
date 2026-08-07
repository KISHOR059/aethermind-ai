import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useUnreadCount } from "./notification.hooks";
import {
  requestNotificationPermission,
  getNotificationPermission,
  showBrowserNotification,
  getToastType,
} from "./browser-notifications";
import { notificationService } from "./notification.service";

export function useNotificationEffects() {
  const prevUnreadCountRef = useRef<number | null>(null);
  const hasRequestedPermissionRef = useRef(false);
  const lastCheckedIdsRef = useRef<Set<string>>(new Set());

  const unreadQuery = useUnreadCount();
  const currentCount = unreadQuery.data?.count ?? 0;

  useEffect(() => {
    if (hasRequestedPermissionRef.current) return;
    if (getNotificationPermission() === "default") {
      hasRequestedPermissionRef.current = true;
      void requestNotificationPermission();
    }
  }, []);

  useEffect(() => {
    const prevCount = prevUnreadCountRef.current;

    if (prevCount === null) {
      prevUnreadCountRef.current = currentCount;
      return;
    }

    if (currentCount > prevCount) {
      const delta = currentCount - prevCount;

      notificationService.list({ limit: delta, isRead: false }).then((data) => {
        const newNotifications = data.items.filter(
          (n) => !lastCheckedIdsRef.current.has(n.id),
        );

        newNotifications.forEach((notification) => {
          lastCheckedIdsRef.current.add(notification.id);
          showBrowserNotification(notification);

          const toastType = getToastType(notification);
          toast[toastType](notification.title, {
            description: notification.message,
            duration: 5000,
          });
        });
      }).catch(() => {
        // Silently ignore fetch errors for notification effects
      });
    }

    prevUnreadCountRef.current = currentCount;
  }, [currentCount]);
}
