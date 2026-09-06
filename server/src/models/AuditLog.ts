import { Schema, model, type InferSchemaType } from "mongoose";
import { AUDIT_MODULES } from "../types/enums.js";

const auditLogSchema = new Schema(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    action: { type: String, required: true, trim: true, index: true },
    module: { type: String, required: true, enum: AUDIT_MODULES, index: true },
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", default: null, index: true },
    recordType: { type: String, required: true, trim: true },
    recordId: { type: Schema.Types.ObjectId, default: null, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "auditLogs" },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ clinicId: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, action: 1, createdAt: -1 });

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema> & { _id: Schema.Types.ObjectId };
export const AuditLog = model("AuditLog", auditLogSchema);
