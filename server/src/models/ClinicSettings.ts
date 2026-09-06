import { Schema, model, type InferSchemaType } from "mongoose";
import { applyActorFields } from "./plugins.js";

const clinicSettingsSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, unique: true },
    receptionEnabled: { type: Boolean, default: true },
    appointmentsEnabled: { type: Boolean, default: true },
    followupsEnabled: { type: Boolean, default: true },
    whatsappEnabled: { type: Boolean, default: false },
    reportsEnabled: { type: Boolean, default: true },
    multipleDoctorsEnabled: { type: Boolean, default: true },
    subscriptionsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "clinicSettings" },
);

applyActorFields(clinicSettingsSchema);

export type ClinicSettingsDocument = InferSchemaType<typeof clinicSettingsSchema> & {
  _id: Schema.Types.ObjectId;
};
export const ClinicSettings = model("ClinicSettings", clinicSettingsSchema);
