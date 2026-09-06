import { Schema, model, type InferSchemaType } from "mongoose";
import { CLINIC_STATUSES } from "../types/enums.js";
import { addressSchema, applyActorFields, applySoftDelete } from "./plugins.js";

const clinicSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    whatsappNumber: { type: String, trim: true, default: "" },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: { type: addressSchema, default: () => ({}) },
    tax: {
      gstin: { type: String, trim: true, default: "" },
      pan: { type: String, trim: true, default: "" },
      legalName: { type: String, trim: true, default: "" },
    },
    status: { type: String, required: true, enum: CLINIC_STATUSES, default: "ACTIVE", index: true },
    timezone: { type: String, default: "Asia/Kolkata" },
    currentSubscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription", default: null },
  },
  { timestamps: true, collection: "clinics" },
);

applySoftDelete(clinicSchema);
applyActorFields(clinicSchema);

clinicSchema.index({ name: 1, isDeleted: 1 });
clinicSchema.index({ status: 1, isDeleted: 1 });
clinicSchema.index({ "address.city": 1, status: 1 });

export type ClinicDocument = InferSchemaType<typeof clinicSchema> & { _id: Schema.Types.ObjectId };
export const Clinic = model("Clinic", clinicSchema);
