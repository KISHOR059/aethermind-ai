import { Router } from "express";
import type { Router as RouterType } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { assistantController } from "./index.js";

const assistantRouter: RouterType = Router();

assistantRouter.get(
  "/conversations",
  requireAuth,
  asyncHandler(assistantController.getConversations),
);

assistantRouter.post(
  "/conversations",
  requireAuth,
  asyncHandler(assistantController.createConversation),
);

assistantRouter.get(
  "/conversations/:id/messages",
  requireAuth,
  asyncHandler(assistantController.getMessages),
);

assistantRouter.patch(
  "/conversations/:id",
  requireAuth,
  asyncHandler(assistantController.updateConversation),
);

assistantRouter.delete(
  "/conversations/:id",
  requireAuth,
  asyncHandler(assistantController.deleteConversation),
);

export default assistantRouter;
