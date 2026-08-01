import { UserModel, type UserDocument } from "./user.model.js";
import type {
  CreateUserData,
  IUserRepository,
} from "./user.repository.interface.js";

export class UserRepository implements IUserRepository {
  public async create(data: CreateUserData): Promise<UserDocument> {
    return UserModel.create(data);
  }

  public async findByEmail(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email }).exec();
  }

  public async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email }).select("+password").exec();
  }

  public async findById(id: string): Promise<UserDocument | null> {
    return UserModel.findById(id).exec();
  }

  
}
