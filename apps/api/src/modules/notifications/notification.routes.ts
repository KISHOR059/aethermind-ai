import { Router } from "express";
import type { Router as RouterType } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { requireCronAuth } from "../../middlewares/cron-auth.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { validateQuery } from "../../middlewares/validate.middleware.js";
import { notificationController } from "./notification.container.js";
import { notificationListQuerySchema } from "./notification.validation.js";

const notificationRouter: RouterType = Router();

/**
 * Serverless / Vercel Cron reminder execution endpoint.
 * Protected by CRON_SECRET Bearer token authentication.
 */
notificationRouter.get(
  "/reminders/run",
  requireCronAuth,
  asyncHandler(notificationController.runReminders),
);

notificationRouter.post(
  "/reminders/run",
  requireCronAuth,
  asyncHandler(notificationController.runReminders),
);

notificationRouter.get(
  "/",
  requireAuth,
  validateQuery(notificationListQuerySchema),
  asyncHandler(notificationController.list),
);

notificationRouter.get(
  "/unread-count",
  requireAuth,
  asyncHandler(notificationController.getUnreadCount),
);

notificationRouter.patch(
  "/:id/read",
  requireAuth,
  asyncHandler(notificationController.markAsRead),
);

notificationRouter.patch(
  "/read-all",
  requireAuth,
  asyncHandler(notificationController.markAllAsRead),
);

notificationRouter.delete(
  "/:id",
  requireAuth,
  asyncHandler(notificationController.delete),
);

export default notificationRouter;
