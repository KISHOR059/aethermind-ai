import { NotFoundError } from "../../../utils/app-error.js";
import type { IUserRepository } from "../../auth/user.repository.interface.js";
import type { ContextProvider } from "./context-provider.interface.js";
import type { UserContext } from "./context.types.js";

export class UserContextProvider implements ContextProvider<UserContext> {
  public constructor(private readonly userRepository: IUserRepository) {}

  public async build(userId: string): Promise<UserContext> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
    };
  }
}
