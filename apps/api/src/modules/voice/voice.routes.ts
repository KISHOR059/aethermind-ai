import { Router, raw } from "express";
import type { Router as RouterType } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { voiceController } from "./voice.controller.js";

const voiceRouter: RouterType = Router();

const rawAudioMiddleware = raw({
  type: [
    "audio/webm",
    "audio/wav",
    "audio/ogg",
    "audio/mp3",
    "audio/m4a",
    "application/octet-stream",
    "multipart/form-data",
  ],
  limit: "25mb",
});

voiceRouter.post(
  "/transcribe",
  requireAuth,
  rawAudioMiddleware,
  asyncHandler(voiceController.transcribe),
);

voiceRouter.post(
  "/speak",
  requireAuth,
  asyncHandler(voiceController.speak),
);

export default voiceRouter;
