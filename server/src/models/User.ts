import { Schema, model, type InferSchemaType } from "mongoose";
import { USER_ROLES, USER_STATUSES } from "../types/enums.js";
import { applyActorFields, applySoftDelete } from "./plugins.js";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    mobileNumber: { type: String, default: null, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: USER_ROLES, index: true },
    status: { type: String, required: true, enum: USER_STATUSES, default: "ACTIVE", index: true },
    lastLoginAt: { type: Date, default: null },
    doctorProfile: {
      specialization: { type: String, trim: true, default: "" },
      registrationNumber: { type: String, trim: true, default: "" },
    },
  },
  { timestamps: true, collection: "users" },
);

applySoftDelete(userSchema);
applyActorFields(userSchema);

userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
userSchema.index(
  { mobileNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false, mobileNumber: { $type: "string" } } },
);
userSchema.index({ role: 1, status: 1, isDeleted: 1 });

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: Schema.Types.ObjectId };
export const User = model("User", userSchema);
