import { Router } from "express";
import type { Router as RouterType } from "express";

import authRouter from "../modules/auth/auth.routes.js";
import taskRouter from "../modules/tasks/task.routes.js";
import healthRouter from "./health.routes.js";

const apiRouter: RouterType = Router();

apiRouter.use("/api/v1", healthRouter);
apiRouter.use("/api/v1/auth", authRouter);
apiRouter.use("/api/v1/tasks", taskRouter);

export default apiRouter;
