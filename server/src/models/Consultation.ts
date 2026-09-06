import { Schema, model, type InferSchemaType } from "mongoose";
import { applyActorFields, applySoftDelete } from "./plugins.js";

const consultationSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    visitId: { type: Schema.Types.ObjectId, ref: "Visit", required: true, unique: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    chiefComplaint: { type: String, default: "", trim: true },
    symptoms: { type: [String], default: [] },
    problemDetails: { type: String, default: "", trim: true },
    diagnosis: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    vitals: {
      bloodPressure: { type: String, default: "" },
      pulse: { type: Number, default: null },
      temperatureC: { type: Number, default: null },
      weightKg: { type: Number, default: null },
      heightCm: { type: Number, default: null },
    },
    followUpRequired: { type: Boolean, default: false },
    followUpAfterDays: { type: Number, default: null, min: 1 },
  },
  { timestamps: true, collection: "consultations" },
);

applySoftDelete(consultationSchema);
applyActorFields(consultationSchema);

consultationSchema.index({ clinicId: 1, patientId: 1, createdAt: -1 });
consultationSchema.index({ clinicId: 1, doctorId: 1, createdAt: -1 });

export type ConsultationDocument = InferSchemaType<typeof consultationSchema> & {
  _id: Schema.Types.ObjectId;
};
export const Consultation = model("Consultation", consultationSchema);
