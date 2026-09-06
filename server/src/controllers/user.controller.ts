import type { Request, Response } from "express";
import { Types } from "mongoose";
import { User } from "../models/User.js";
import {
  AdminClinicAssignment,
  DoctorClinicAssignment,
  ReceptionClinicAssignment,
} from "../models/ClinicAssignments.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { assignUserToClinic } from "../services/assignment.service.js";
import { writeAuditLog } from "../services/audit.service.js";
import { createUser } from "../test/factories.js";
import { hashPassword } from "../utils/password.js";
import { ok, param, parsePagination } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import type { UserRole } from "../types/enums.js";

function actorId(req: Request) {
  return new Types.ObjectId(req.authUser!.id);
}

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { skip, limit, page } = parsePagination(req.query as Record<string, unknown>);
  const filter: Record<string, unknown> = { isDeleted: false };
  const role = String(req.query.role ?? "");
  const q = String(req.query.q ?? "").trim();
  if (role) filter.role = role;
  if (q) {
    filter.$or = [
      { name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      { email: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  const userIds = items.map((item) => item._id);
  const [adminA, doctorA, receptionA] = await Promise.all([
    AdminClinicAssignment.find({ userId: { $in: userIds }, isDeleted: false }).populate("clinicId", "name").lean(),
    DoctorClinicAssignment.find({ userId: { $in: userIds }, isDeleted: false }).populate("clinicId", "name").lean(),
    ReceptionClinicAssignment.find({ userId: { $in: userIds }, isDeleted: false }).populate("clinicId", "name").lean(),
  ]);
  const assignments = [...adminA, ...doctorA, ...receptionA];
  const clinicsByUser = new Map<string, string[]>();
  for (const row of assignments) {
    const key = row.userId.toString();
    const name = (row.clinicId as { name?: string })?.name ?? "";
    clinicsByUser.set(key, [...(clinicsByUser.get(key) ?? []), name]);
  }

  return ok(res, "Users retrieved successfully", {
    items: items.map((item) => ({ ...item, assignedClinics: clinicsByUser.get(item._id.toString()) ?? [] })),
    total,
    page,
    limit,
  });
});

export const createUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await createUser({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role,
    mobileNumber: req.body.mobileNumber,
    specialization: req.body.specialization,
    registrationNumber: req.body.registrationNumber,
  });

  if (req.body.clinicId && user.role !== "SUPER_ADMIN") {
    await assignUserToClinic({
      role: user.role as Exclude<UserRole, "SUPER_ADMIN">,
      userId: user._id,
      clinicId: new Types.ObjectId(req.body.clinicId),
      actorUserId: actorId(req),
      isPrimary: true,
    });
  }

  await writeAuditLog({
    actorUserId: actorId(req),
    action: "Created User",
    module: "USER",
    clinicId: req.body.clinicId ? new Types.ObjectId(req.body.clinicId) : null,
    recordType: "User",
    recordId: user._id,
    ipAddress: req.ip ?? "",
  });

  const safe = await User.findById(user._id).lean();
  return ok(res, "User created successfully", { user: safe }, 201);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findOne({ _id: param(req, "userId"), isDeleted: false }).select("+passwordHash");
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  user.passwordHash = await hashPassword(req.body.password);
  await user.save();
  await writeAuditLog({
    actorUserId: actorId(req),
    action: "Reset Password",
    module: "USER",
    recordType: "User",
    recordId: user._id,
    ipAddress: req.ip ?? "",
  });
  return ok(res, "Password reset successfully");
});

export const assignStaff = asyncHandler(async (req: Request, res: Response) => {
  const rolePath = req.path.includes("/doctors")
    ? "DOCTOR"
    : req.path.includes("/reception")
      ? "RECEPTION"
      : "ADMIN";
  const user = await User.findOne({ _id: req.body.userId, isDeleted: false });
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  if (user.role !== rolePath) {
    throw new AppError(`User is not a ${rolePath}`, 400, "VALIDATION_ERROR");
  }
  const assignment = await assignUserToClinic({
    role: rolePath,
    userId: user._id,
    clinicId: new Types.ObjectId(param(req, "clinicId")),
    actorUserId: actorId(req),
  });
  await writeAuditLog({
    actorUserId: actorId(req),
    action: `Assigned ${rolePath}`,
    module: "ASSIGNMENT",
    clinicId: new Types.ObjectId(param(req, "clinicId")),
    recordType: "Assignment",
    recordId: assignment._id,
    ipAddress: req.ip ?? "",
  });
  return ok(res, "Staff assigned successfully", { assignment }, 201);
});
