import { Schema, model, type InferSchemaType } from "mongoose";
import { applyActorFields, applySoftDelete } from "./plugins.js";

const familySchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    name: { type: String, required: true, trim: true },
    primaryMobile: { type: String, default: null, trim: true },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "families" },
);

applySoftDelete(familySchema);
applyActorFields(familySchema);

familySchema.index({ clinicId: 1, name: 1, isDeleted: 1 });
familySchema.index({ clinicId: 1, primaryMobile: 1, isDeleted: 1 });

export type FamilyDocument = InferSchemaType<typeof familySchema> & { _id: Schema.Types.ObjectId };
export const Family = model("Family", familySchema);
