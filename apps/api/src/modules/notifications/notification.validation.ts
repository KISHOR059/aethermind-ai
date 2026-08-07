import { z } from "zod";

import {
  paginationQuerySchema,
  parseFilters,
  parsePagination,
  parseSearch,
  parseSort,
} from "../../shared/query/index.js";
import {
  NotificationPriority,
  NotificationType,
} from "./notification.model.js";

const notificationSortFields = [
  "createdAt",
  "priority",
  "type",
] as const;

export const notificationListQuerySchema = z
  .object({
    ...paginationQuerySchema.shape,
    type: z.nativeEnum(NotificationType).optional(),
    priority: z.nativeEnum(NotificationPriority).optional(),
    isRead: z.preprocess((value) => {
      if (value === "true" || value === true) return true;
      if (value === "false" || value === false) return false;
      return undefined;
    }, z.boolean().optional()),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  })
  .transform((input) => ({
    pagination: parsePagination(input),
    sort: parseSort(input, notificationSortFields, "createdAt"),
    search: parseSearch(input.search),
    filters: parseFilters({
      type: input.type,
      priority: input.priority,
      isRead: input.isRead,
    }),
  }));

export type NotificationListQueryInput = z.input<typeof notificationListQuerySchema>;
export type NotificationListQueryOutput = z.output<typeof notificationListQuerySchema>;
