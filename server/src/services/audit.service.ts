import { Types } from "mongoose";
import { AuditLog } from "../models/AuditLog.js";
import type { AuditModule } from "../types/enums.js";

type WriteAuditInput = {
  actorUserId?: Types.ObjectId | null;
  action: string;
  module: AuditModule;
  clinicId?: Types.ObjectId | null;
  recordType: string;
  recordId?: Types.ObjectId | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
};

export async function writeAuditLog(input: WriteAuditInput) {
  return AuditLog.create({
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    module: input.module,
    clinicId: input.clinicId ?? null,
    recordType: input.recordType,
    recordId: input.recordId ?? null,
    metadata: input.metadata ?? {},
    ipAddress: input.ipAddress ?? "",
    userAgent: input.userAgent ?? "",
  });
}
