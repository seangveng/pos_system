import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "CUSTOMER" | "STAFF" | "ADMIN" | "OWNER";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      select: false,
    },

    phone: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      enum: ["CUSTOMER", "STAFF", "ADMIN", "OWNER"],
      default: "CUSTOMER",
      required: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
