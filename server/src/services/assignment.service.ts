import { Types } from "mongoose";
import {
  AdminClinicAssignment,
  DoctorClinicAssignment,
  ReceptionClinicAssignment,
} from "../models/ClinicAssignments.js";
import type { UserRole } from "../types/enums.js";

const assignmentModelByRole = {
  ADMIN: AdminClinicAssignment,
  DOCTOR: DoctorClinicAssignment,
  RECEPTION: ReceptionClinicAssignment,
} as const;

export async function assignUserToClinic(params: {
  role: Exclude<UserRole, "SUPER_ADMIN">;
  userId: Types.ObjectId;
  clinicId: Types.ObjectId;
  actorUserId?: Types.ObjectId | null;
  isPrimary?: boolean;
}) {
  const Model = assignmentModelByRole[params.role];
  return Model.create({
    userId: params.userId,
    clinicId: params.clinicId,
    isPrimary: params.isPrimary ?? false,
    status: "ACTIVE",
    createdBy: params.actorUserId ?? null,
  });
}

export async function getAssignedClinicIds(
  role: Exclude<UserRole, "SUPER_ADMIN">,
  userId: Types.ObjectId,
): Promise<Types.ObjectId[]> {
  const Model = assignmentModelByRole[role];
  const rows = await Model.find({ userId, isDeleted: false, status: "ACTIVE" })
    .select("clinicId")
    .lean();
  return rows.map((row) => row.clinicId);
}

export function assertClinicAccess(assignedClinicIds: Types.ObjectId[], clinicId: Types.ObjectId): void {
  const allowed = assignedClinicIds.some((id) => id.equals(clinicId));
  if (!allowed) {
    throw new Error("Clinic access denied");
  }
}

export async function getAccessibleClinicIds(role: UserRole, userId: Types.ObjectId): Promise<Types.ObjectId[]> {
  if (role === "SUPER_ADMIN") {
    return [];
  }
  return getAssignedClinicIds(role, userId);
}
