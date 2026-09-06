import { Schema, model, type InferSchemaType } from "mongoose";

const systemSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String, default: "" },
  },
  { timestamps: true, collection: "systemSettings" },
);

export type SystemSettingDocument = InferSchemaType<typeof systemSettingSchema> & {
  _id: Schema.Types.ObjectId;
};
export const SystemSetting = model("SystemSetting", systemSettingSchema);
