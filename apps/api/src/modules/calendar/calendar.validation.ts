import { z } from "zod";

import { TaskPriority, TaskStatus } from "../tasks/task.model.js";
import { CalendarView } from "./calendar.types.js";

const isoDateSchema = z.string().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  {
    message:
      "Invalid date. Expected an ISO-8601 date string (e.g. 2026-08-07 or 2026-08-07T10:00:00.000Z).",
  },
);

export const calendarQuerySchema = z
  .object({
    startDate: isoDateSchema.optional(),
    endDate: isoDateSchema.optional(),
    view: z.nativeEnum(CalendarView).optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
  })
  .refine(
    (input) =>
      !input.startDate ||
      !input.endDate ||
      Date.parse(input.startDate) <= Date.parse(input.endDate),
    {
      message: "startDate must not be after endDate",
      path: ["startDate"],
    },
  );

export type CalendarQueryInput = z.input<typeof calendarQuerySchema>;
export type CalendarQueryOutput = z.output<typeof calendarQuerySchema>;
