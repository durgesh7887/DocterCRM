import { Schema, model, type InferSchemaType } from "mongoose";
import { APPOINTMENT_STATUSES } from "../types/enums.js";
import { applyActorFields, applySoftDelete } from "./plugins.js";

const appointmentSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    appointmentDate: { type: Date, required: true },
    durationMinutes: { type: Number, default: 15, min: 5 },
    status: { type: String, required: true, enum: APPOINTMENT_STATUSES, default: "SCHEDULED", index: true },
    notes: { type: String, default: "", trim: true },
    visitId: { type: Schema.Types.ObjectId, ref: "Visit", default: null },
  },
  { timestamps: true, collection: "appointments" },
);

applySoftDelete(appointmentSchema);
applyActorFields(appointmentSchema);

appointmentSchema.index({ clinicId: 1, appointmentDate: 1, status: 1, isDeleted: 1 });
appointmentSchema.index({ clinicId: 1, doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ clinicId: 1, patientId: 1, appointmentDate: -1 });

export type AppointmentDocument = InferSchemaType<typeof appointmentSchema> & {
  _id: Schema.Types.ObjectId;
};
export const Appointment = model("Appointment", appointmentSchema);
