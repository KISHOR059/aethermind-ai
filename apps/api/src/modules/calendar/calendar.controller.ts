import type { Request, Response } from "express";

import { UnauthorizedError } from "../../utils/app-error.js";
import { successResponse } from "../../utils/response.js";
import type { CalendarService } from "./calendar.service.js";
import type { CalendarQueryOutput } from "./calendar.validation.js";

export class CalendarController {
  public constructor(private readonly calendarService: CalendarService) {}

  public getEvents = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const result = await this.calendarService.getEvents(
      request.user.id,
      request.query as unknown as CalendarQueryOutput,
    );

    successResponse(response, result, "Calendar events retrieved successfully");
  };
}
