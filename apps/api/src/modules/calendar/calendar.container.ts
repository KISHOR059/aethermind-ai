import { CalendarController } from "./calendar.controller.js";
import { CalendarService } from "./calendar.service.js";
import { taskService } from "../tasks/task.container.js";

const calendarService = new CalendarService(taskService);

export const calendarController = new CalendarController(calendarService);

export { calendarService };
