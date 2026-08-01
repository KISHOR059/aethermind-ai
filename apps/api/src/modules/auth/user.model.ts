import {
  HydratedDocument,
  model,
  Schema,
  type Model,
} from "mongoose";

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  avatar?: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;
export type UserModel = Model<User>;

const userSchema = new Schema<User>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    avatar: { type: String, trim: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const UserModel = model<User, UserModel>("User", userSchema);
