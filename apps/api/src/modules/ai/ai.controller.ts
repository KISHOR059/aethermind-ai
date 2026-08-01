import type { Request, Response } from "express";

import { UnauthorizedError } from "../../utils/app-error.js";
import { successResponse } from "../../utils/response.js";
import type { AiService } from "./ai.service.js";

export class AiController {
  public constructor(private readonly aiService: AiService) {}

  public health = async (
    _request: Request,
    response: Response,
  ): Promise<void> => {
    successResponse(
      response,
      this.aiService.getHealth(),
      "AI service is available",
    );
  };

  public planDay = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const result = await this.aiService.planDay(request.user.id);

    successResponse(response, result, "Daily plan generated successfully");
  };
}
