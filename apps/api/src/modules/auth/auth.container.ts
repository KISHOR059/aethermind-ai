import { AuthService } from "./auth.service.js";
import { SessionRepository } from "./session.repository.js";
import { UserRepository } from "./user.repository.js";

const userRepository = new UserRepository();
const sessionRepository = new SessionRepository();

export const authService = new AuthService(userRepository, sessionRepository);
