import { DashboardController } from "./dashboard.controller.js";
import { DashboardService } from "./dashboard.service.js";

const dashboardService = new DashboardService();
export const dashboardController = new DashboardController(dashboardService);

export { DashboardController } from "./dashboard.controller.js";
export { DashboardService } from "./dashboard.service.js";
export default dashboardService;
