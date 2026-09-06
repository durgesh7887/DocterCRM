import { Schema, model, type InferSchemaType } from "mongoose";

const permissionSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    module: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true, trim: true },
  },
  { timestamps: true, collection: "permissions" },
);

export type PermissionDocument = InferSchemaType<typeof permissionSchema> & { _id: Schema.Types.ObjectId };
export const Permission = model("Permission", permissionSchema);
