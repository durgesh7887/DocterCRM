import { Schema, model, type InferSchemaType } from "mongoose";
import { VISIT_STATUSES, VISIT_TYPES } from "../types/enums.js";
import { applyActorFields, applySoftDelete } from "./plugins.js";

const visitSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", default: null },
    visitCode: { type: String, required: true, trim: true },
    visitDate: { type: Date, required: true, index: true },
    visitType: { type: String, required: true, enum: VISIT_TYPES, default: "WALK_IN" },
    status: { type: String, required: true, enum: VISIT_STATUSES, default: "OPEN", index: true },
    chiefComplaint: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "visits" },
);

applySoftDelete(visitSchema);
applyActorFields(visitSchema);

visitSchema.index(
  { clinicId: 1, visitCode: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
visitSchema.index({ clinicId: 1, visitDate: -1 });
visitSchema.index({ clinicId: 1, patientId: 1, visitDate: -1 });
visitSchema.index({ clinicId: 1, doctorId: 1, visitDate: -1 });

export type VisitDocument = InferSchemaType<typeof visitSchema> & { _id: Schema.Types.ObjectId };
export const Visit = model("Visit", visitSchema);
