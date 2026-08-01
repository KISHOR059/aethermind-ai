import { TaskService } from "./task.service.js";
import { TaskRepository } from "./task.repository.js";

const taskRepository = new TaskRepository();

export const taskService = new TaskService(taskRepository);
