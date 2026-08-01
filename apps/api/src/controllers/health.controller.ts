import type { Request, Response } from "express";

import { MESSAGES } from "../constants/messages.js";
import { successResponse } from "../utils/response.js";

export async function getHealth(
  _request: Request,
  response: Response,
): Promise<void> {
  successResponse(
    response,
    {
      status: "ok",
      service: "aethermind-api",
      version: "1.0.0",
    },
    MESSAGES.HEALTH_CHECK_SUCCESS,
  );
}
