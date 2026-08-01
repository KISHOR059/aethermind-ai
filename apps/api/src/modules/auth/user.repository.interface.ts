import type { UserDocument } from "./user.model.js";

export type CreateUserData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  avatar?: string;
};

export interface IUserRepository {
  create(data: CreateUserData): Promise<UserDocument>;
  findByEmail(email: string): Promise<UserDocument | null>;
  findByEmailWithPassword(email: string): Promise<UserDocument | null>;
  findById(id: string): Promise<UserDocument | null>;
}
