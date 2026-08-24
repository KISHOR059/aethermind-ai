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

export const JUST_LOGGED_IN_KEY = "aethermind_just_logged_in";

export function useNotificationEffects() {
  const prevUnreadCountRef = useRef<number | null>(null);
  const hasRequestedPermissionRef = useRef(false);
  const isInitializedRef = useRef(false);
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
    // Wait until the unread query has actually loaded from the server
    if (!unreadQuery.isSuccess) {
      return;
    }

    // 1. Initial Load / App Mount
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      prevUnreadCountRef.current = currentCount;

      const justLoggedIn = sessionStorage.getItem(JUST_LOGGED_IN_KEY) === "true";

      if (justLoggedIn) {
        sessionStorage.removeItem(JUST_LOGGED_IN_KEY);

        if (currentCount > 0) {
          notificationService
            .list({ limit: Math.min(currentCount, 5), isRead: false })
            .then((data) => {
              data.items.forEach((notification) => {
                lastCheckedIdsRef.current.add(notification.id);
                showBrowserNotification(notification);

                const toastType = getToastType(notification);
                toast[toastType](notification.title, {
                  description: notification.message,
                  duration: 5000,
                });
              });
            })
            .catch(() => {
              // Silently ignore fetch errors
            });
        }
      } else {
        // Page Refresh: populate already known IDs quietly without spamming toasts
        if (currentCount > 0) {
          notificationService
            .list({ limit: Math.min(currentCount, 50), isRead: false })
            .then((data) => {
              data.items.forEach((notification) => {
                lastCheckedIdsRef.current.add(notification.id);
              });
            })
            .catch(() => {
              // Silently ignore fetch errors
            });
        }
      }

      return;
    }

    // 2. Subsequent Updates (New notifications arriving while using the app)
    const prevCount = prevUnreadCountRef.current ?? 0;

    if (currentCount > prevCount) {
      const delta = currentCount - prevCount;

      notificationService
        .list({ limit: delta, isRead: false })
        .then((data) => {
          const newNotifications = data.items.filter(
            (n) => !lastCheckedIdsRef.current.has(n.id),
          );

          newNotifications.forEach((notification) => {
            lastCheckedIdsRef.current.add(notification.id);
            if (lastCheckedIdsRef.current.size > 200) {
              const iterator = lastCheckedIdsRef.current.values();
              for (let i = 0; i < 50; i++) {
                const { value } = iterator.next();
                if (value) lastCheckedIdsRef.current.delete(value);
              }
            }
            showBrowserNotification(notification);

            const toastType = getToastType(notification);
            toast[toastType](notification.title, {
              description: notification.message,
              duration: 5000,
            });
          });
        })
        .catch(() => {
          // Silently ignore fetch errors for notification effects
        });
    }

    prevUnreadCountRef.current = currentCount;
  }, [currentCount, unreadQuery.isSuccess]);
}
