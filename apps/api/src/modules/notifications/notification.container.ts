import { NotificationRepository } from "./notification.repository.js";
import { NotificationService } from "./notification.service.js";
import { NotificationController } from "./notification.controller.js";

const notificationRepository = new NotificationRepository();

export const notificationService = new NotificationService(notificationRepository);

export const notificationController = new NotificationController(notificationService);
