import type { QueryClient } from "@tanstack/react-query";

import { taskKeys } from "@/features/tasks/task.hooks";
import { dashboardKeys } from "@/features/dashboard/dashboard.hooks";
import { aiKeys } from "@/features/ai/ai.hooks";
import { calendarKeys } from "@/features/calendar/calendar.hooks";
import { notificationKeys } from "@/features/notifications/notification.hooks";

/**
 * Invalidates all workspace queries (Tasks, Calendar, Dashboard Stats,
 * Notifications, AI Insights / Productivity) to ensure immediate, automatic
 * UI synchronization whenever task data is modified.
 */
export async function invalidateWorkspaceTaskQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: taskKeys.all }),
    queryClient.invalidateQueries({ queryKey: calendarKeys.all }),
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
    queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
    queryClient.invalidateQueries({ queryKey: aiKeys.all }),
  ]);
}
