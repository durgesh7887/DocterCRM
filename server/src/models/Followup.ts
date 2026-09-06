import { Schema, model, type InferSchemaType } from "mongoose";
import { FOLLOWUP_STATUSES } from "../types/enums.js";
import { applyActorFields, applySoftDelete } from "./plugins.js";

const followupSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    visitId: { type: Schema.Types.ObjectId, ref: "Visit", required: true, index: true },
    consultationId: { type: Schema.Types.ObjectId, ref: "Consultation", default: null },
    doctorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    followupDate: { type: Date, required: true },
    followUpAfterDays: { type: Number, required: true, min: 1 },
    status: { type: String, required: true, enum: FOLLOWUP_STATUSES, default: "UPCOMING", index: true },
    completedAt: { type: Date, default: null },
    completedVisitId: { type: Schema.Types.ObjectId, ref: "Visit", default: null },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "followups" },
);

applySoftDelete(followupSchema);
applyActorFields(followupSchema);

followupSchema.index({ clinicId: 1, followupDate: 1, status: 1, isDeleted: 1 });
followupSchema.index({ clinicId: 1, patientId: 1, followupDate: -1 });

export type FollowupDocument = InferSchemaType<typeof followupSchema> & { _id: Schema.Types.ObjectId };
export const Followup = model("Followup", followupSchema);
