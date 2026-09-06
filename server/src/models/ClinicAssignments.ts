import { Schema, model, type InferSchemaType } from "mongoose";
import { applyActorFields, applySoftDelete } from "./plugins.js";

function assignmentSchema(collection: string) {
  const schema = new Schema(
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
      clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
      isPrimary: { type: Boolean, default: false },
      status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    },
    { timestamps: true, collection },
  );

  applySoftDelete(schema);
  applyActorFields(schema);

  schema.index(
    { userId: 1, clinicId: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } },
  );
  schema.index({ clinicId: 1, status: 1, isDeleted: 1 });

  return schema;
}

const adminClinicAssignmentSchema = assignmentSchema("adminClinicAssignments");
const doctorClinicAssignmentSchema = assignmentSchema("doctorClinicAssignments");
const receptionClinicAssignmentSchema = assignmentSchema("receptionClinicAssignments");

export type AdminClinicAssignmentDocument = InferSchemaType<typeof adminClinicAssignmentSchema> & {
  _id: Schema.Types.ObjectId;
};
export type DoctorClinicAssignmentDocument = InferSchemaType<typeof doctorClinicAssignmentSchema> & {
  _id: Schema.Types.ObjectId;
};
export type ReceptionClinicAssignmentDocument = InferSchemaType<
  typeof receptionClinicAssignmentSchema
> & { _id: Schema.Types.ObjectId };

export const AdminClinicAssignment = model("AdminClinicAssignment", adminClinicAssignmentSchema);
export const DoctorClinicAssignment = model("DoctorClinicAssignment", doctorClinicAssignmentSchema);
export const ReceptionClinicAssignment = model(
  "ReceptionClinicAssignment",
  receptionClinicAssignmentSchema,
);
