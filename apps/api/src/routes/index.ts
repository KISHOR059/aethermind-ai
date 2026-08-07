import { Router } from "express";
import type { Router as RouterType } from "express";

import activityRouter from "../modules/activity/activity.routes.js";
import aiRouter from "../modules/ai/ai.routes.js";
import assistantRouter from "../modules/assistant/assistant.routes.js";
import authRouter from "../modules/auth/auth.routes.js";
import calendarRouter from "../modules/calendar/calendar.routes.js";
import dashboardRouter from "../modules/dashboard/dashboard.routes.js";
import notificationRouter from "../modules/notifications/notification.routes.js";
import taskRouter from "../modules/tasks/task.routes.js";
import voiceRouter from "../modules/voice/voice.routes.js";
import healthRouter from "./health.routes.js";

const apiRouter: RouterType = Router();

apiRouter.use("/api/v1", healthRouter);
apiRouter.use("/api/v1/auth", authRouter);
apiRouter.use("/api/v1/activity", activityRouter);
apiRouter.use("/api/v1/ai", aiRouter);
apiRouter.use("/api/v1/assistant", assistantRouter);
apiRouter.use("/api/v1/calendar", calendarRouter);
apiRouter.use("/api/v1/dashboard", dashboardRouter);
apiRouter.use("/api/v1/notifications", notificationRouter);
apiRouter.use("/api/v1/tasks", taskRouter);
apiRouter.use("/api/v1/voice", voiceRouter);

export default apiRouter;
