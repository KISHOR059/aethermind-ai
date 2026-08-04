import { Router } from "express";
import type { Router as RouterType } from "express";

import aiRouter from "../modules/ai/ai.routes.js";
import authRouter from "../modules/auth/auth.routes.js";
import dashboardRouter from "../modules/dashboard/dashboard.routes.js";
import taskRouter from "../modules/tasks/task.routes.js";
import healthRouter from "./health.routes.js";

const apiRouter: RouterType = Router();

apiRouter.use("/api/v1", healthRouter);
apiRouter.use("/api/v1/auth", authRouter);
apiRouter.use("/api/v1/ai", aiRouter);
apiRouter.use("/api/v1/dashboard", dashboardRouter);
apiRouter.use("/api/v1/tasks", taskRouter);

export default apiRouter;
