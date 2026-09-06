import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Clinic } from "../models/Clinic.js";
import { ClinicSettings } from "../models/ClinicSettings.js";
import {
  AdminClinicAssignment,
  DoctorClinicAssignment,
  ReceptionClinicAssignment,
} from "../models/ClinicAssignments.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { writeAuditLog } from "../services/audit.service.js";
import { createClinic } from "../test/factories.js";
import { ok, param, parsePagination } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { normalizeMobile } from "../utils/dateAndIdentity.js";

function actorId(req: Request) {
  return new Types.ObjectId(req.authUser!.id);
}

export const listClinics = asyncHandler(async (req: Request, res: Response) => {
  const { skip, limit, page } = parsePagination(req.query as Record<string, unknown>);
  const filter: Record<string, unknown> = { isDeleted: false };
  const q = String(req.query.q ?? "").trim();
  const status = String(req.query.status ?? "").trim();
  if (status) filter.status = status;
  if (q) filter.name = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  if (req.authUser!.role !== "SUPER_ADMIN") {
    filter._id = { $in: req.authUser!.clinicIds };
  }

  const [items, total] = await Promise.all([
    Clinic.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Clinic.countDocuments(filter),
  ]);

  const clinicIds = items.map((item) => item._id);
  const settings = await ClinicSettings.find({ clinicId: { $in: clinicIds } }).lean();
  const settingsByClinic = new Map(settings.map((row) => [row.clinicId.toString(), row]));

  return ok(res, "Clinics retrieved successfully", {
    items: items.map((item) => ({ ...item, settings: settingsByClinic.get(item._id.toString()) ?? null })),
    total,
    page,
    limit,
  });
});

export const getClinic = asyncHandler(async (req: Request, res: Response) => {
  const clinic = await Clinic.findOne({ _id: param(req, "clinicId"), isDeleted: false }).lean();
  if (!clinic) throw new AppError("Clinic not found", 404, "NOT_FOUND");
  const settings = await ClinicSettings.findOne({ clinicId: clinic._id }).lean();
  return ok(res, "Clinic retrieved successfully", { clinic, settings });
});

export const createClinicHandler = asyncHandler(async (req: Request, res: Response) => {
  const clinic = await createClinic({
    name: req.body.name,
    ownerName: req.body.ownerName,
    mobile: req.body.mobile,
    email: req.body.email,
    city: req.body.city,
    state: req.body.state,
    receptionEnabled: req.body.receptionEnabled,
  });
  if (req.body.whatsappNumber) {
    clinic.set("whatsappNumber", req.body.whatsappNumber);
  }
  if (req.body.gstin) {
    clinic.set("tax.gstin", req.body.gstin);
  }
  if (req.body.whatsappNumber || req.body.gstin) {
    await clinic.save();
  }
  await writeAuditLog({
    actorUserId: actorId(req),
    action: "Created Clinic",
    module: "CLINIC",
    clinicId: clinic._id,
    recordType: "Clinic",
    recordId: clinic._id,
    ipAddress: req.ip ?? "",
  });
  return ok(res, "Clinic created successfully", { clinic }, 201);
});

export const updateClinic = asyncHandler(async (req: Request, res: Response) => {
  const $set: Record<string, unknown> = { updatedBy: actorId(req) };
  if (req.body.name) $set.name = req.body.name;
  if (req.body.ownerName) $set.ownerName = req.body.ownerName;
  if (req.body.mobile) $set.mobile = normalizeMobile(req.body.mobile) ?? req.body.mobile;
  if (req.body.whatsappNumber !== undefined) $set.whatsappNumber = req.body.whatsappNumber;
  if (req.body.email) $set.email = req.body.email.toLowerCase();
  if (req.body.city) $set["address.city"] = req.body.city;
  if (req.body.state) $set["address.state"] = req.body.state;
  if (req.body.gstin) $set["tax.gstin"] = req.body.gstin;
  const clinic = await Clinic.findOneAndUpdate(
    { _id: param(req, "clinicId"), isDeleted: false },
    { $set },
    { new: true },
  );
  if (!clinic) throw new AppError("Clinic not found", 404, "NOT_FOUND");

  await writeAuditLog({
    actorUserId: actorId(req),
    action: "Updated Clinic",
    module: "CLINIC",
    clinicId: clinic._id,
    recordType: "Clinic",
    recordId: clinic._id,
    ipAddress: req.ip ?? "",
  });
  return ok(res, "Clinic updated successfully", { clinic });
});

export const setClinicStatus = asyncHandler(async (req: Request, res: Response) => {
  const status = req.path.endsWith("deactivate") ? "INACTIVE" : "ACTIVE";
  const clinic = await Clinic.findOneAndUpdate(
    { _id: param(req, "clinicId"), isDeleted: false },
    { $set: { status, updatedBy: actorId(req) } },
    { new: true },
  );
  if (!clinic) throw new AppError("Clinic not found", 404, "NOT_FOUND");
  await writeAuditLog({
    actorUserId: actorId(req),
    action: status === "ACTIVE" ? "Activated Clinic" : "Deactivated Clinic",
    module: "CLINIC",
    clinicId: clinic._id,
    recordType: "Clinic",
    recordId: clinic._id,
    ipAddress: req.ip ?? "",
  });
  return ok(res, `Clinic ${status.toLowerCase()}`, { clinic });
});

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await ClinicSettings.findOne({ clinicId: param(req, "clinicId") }).lean();
  if (!settings) throw new AppError("Settings not found", 404, "NOT_FOUND");
  return ok(res, "Clinic settings retrieved successfully", { settings });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await ClinicSettings.findOneAndUpdate(
    { clinicId: param(req, "clinicId") },
    { $set: { ...req.body, updatedBy: actorId(req) } },
    { new: true },
  );
  if (!settings) throw new AppError("Settings not found", 404, "NOT_FOUND");
  return ok(res, "Clinic settings updated successfully", { settings });
});

export const clinicStaff = asyncHandler(async (req: Request, res: Response) => {
  const clinicId = new Types.ObjectId(param(req, "clinicId"));
  const [admins, doctors, reception] = await Promise.all([
    AdminClinicAssignment.find({ clinicId, isDeleted: false }).populate("userId", "name email role status mobileNumber").lean(),
    DoctorClinicAssignment.find({ clinicId, isDeleted: false }).populate("userId", "name email role status mobileNumber doctorProfile").lean(),
    ReceptionClinicAssignment.find({ clinicId, isDeleted: false }).populate("userId", "name email role status mobileNumber").lean(),
  ]);
  return ok(res, "Clinic staff retrieved successfully", { admins, doctors, reception });
});
