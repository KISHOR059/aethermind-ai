import { CalendarController } from "./calendar.controller.js";
import { CalendarService } from "./calendar.service.js";

const calendarService = new CalendarService();

export const calendarController = new CalendarController(calendarService);

export { calendarService };
