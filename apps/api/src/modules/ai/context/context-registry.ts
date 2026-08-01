import { UserRepository } from "../../auth/user.repository.js";
import type { IUserRepository } from "../../auth/user.repository.interface.js";
import { TaskRepository } from "../../tasks/task.repository.js";
import type { ITaskRepository } from "../../tasks/task.repository.interface.js";
import type { ContextProvider } from "./context-provider.interface.js";
import type {
  SettingsContext,
  SystemContext,
  TaskContext,
  TimeContext,
  UserContext,
} from "./context.types.js";
import {
  SettingsContextProvider,
  type SettingsResolver,
} from "./settings-context.provider.js";
import { SystemContextProvider } from "./system-context.provider.js";
import { TaskContextProvider } from "./task-context.provider.js";
import { TimeContextProvider } from "./time-context.provider.js";
import { UserContextProvider } from "./user-context.provider.js";

export type ContextProviderRegistry = {
  readonly user: ContextProvider<UserContext>;
  readonly tasks: ContextProvider<TaskContext>;
  readonly settings: ContextProvider<SettingsContext>;
  readonly time: ContextProvider<TimeContext>;
  readonly system: ContextProvider<SystemContext>;
};

export type ContextProviderDependencies = {
  readonly userRepository?: IUserRepository;
  readonly taskRepository?: ITaskRepository;
  readonly settingsResolver?: SettingsResolver;
};

export function createContextProviderRegistry(
  dependencies: ContextProviderDependencies = {},
): ContextProviderRegistry {
  const userRepository =
    dependencies.userRepository ?? new UserRepository();
  const taskRepository =
    dependencies.taskRepository ?? new TaskRepository();

  return {
    user: new UserContextProvider(userRepository),
    tasks: new TaskContextProvider(taskRepository),
    settings: new SettingsContextProvider(dependencies.settingsResolver),
    time: new TimeContextProvider(),
    system: new SystemContextProvider(),
  };
}
