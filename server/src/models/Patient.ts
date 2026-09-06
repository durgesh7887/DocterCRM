import { Schema, model, type InferSchemaType } from "mongoose";
import { GENDERS } from "../types/enums.js";
import { addressSchema, applyActorFields, applySoftDelete } from "./plugins.js";

const patientSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true },
    familyId: { type: Schema.Types.ObjectId, ref: "Family", default: null, index: true },
    patientCode: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    nameNormalized: { type: String, required: true, trim: true, lowercase: true },
    mobileNumber: { type: String, default: null, trim: true },
    isMobileOwner: { type: Boolean, default: true },
    gender: { type: String, enum: GENDERS, default: "UNSPECIFIED" },
    dateOfBirth: { type: Date, default: null },
    bloodGroup: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    address: { type: addressSchema, default: () => ({}) },
    notes: { type: String, default: "", trim: true },
    lastVisitAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "patients" },
);

applySoftDelete(patientSchema);
applyActorFields(patientSchema);

patientSchema.index(
  { clinicId: 1, patientCode: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
patientSchema.index({ clinicId: 1, mobileNumber: 1, isDeleted: 1 });
patientSchema.index({ clinicId: 1, nameNormalized: 1, isDeleted: 1 });
patientSchema.index({ clinicId: 1, familyId: 1, isDeleted: 1 });
patientSchema.index({ clinicId: 1, createdAt: -1 });

export type PatientDocument = InferSchemaType<typeof patientSchema> & { _id: Schema.Types.ObjectId };
export const Patient = model("Patient", patientSchema);
