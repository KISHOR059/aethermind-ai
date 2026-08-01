import { AuthService } from "./auth.service.js";
import { UserRepository } from "./user.repository.js";

const userRepository = new UserRepository();

export const authService = new AuthService(userRepository);
