import { Router } from "express";
import type { Router as RouterType } from "express";

import healthRouter from "./health.routes.js";

const apiRouter: RouterType = Router();

apiRouter.use("/api/v1", healthRouter);

export default apiRouter;
