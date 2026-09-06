import { Schema, model, type InferSchemaType } from "mongoose";
import { USER_ROLES } from "../types/enums.js";

const roleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, enum: USER_ROLES },
    description: { type: String, required: true, trim: true },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "roles" },
);

export type RoleDocument = InferSchemaType<typeof roleSchema> & { _id: Schema.Types.ObjectId };
export const Role = model("Role", roleSchema);
