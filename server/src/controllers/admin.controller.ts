import type { Request, Response } from "express";
import { Types } from "mongoose";
import { AuditLog } from "../models/AuditLog.js";
import { Payment } from "../models/Payment.js";
import { Subscription } from "../models/Subscription.js";
import { SystemSetting } from "../models/SystemSetting.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { clinicDashboard, followupMetrics, superAdminDashboard } from "../services/dashboard.service.js";
import { writeAuditLog } from "../services/audit.service.js";
import { ok, param, parsePagination } from "../utils/apiResponse.js";

export const getSuperDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const data = await superAdminDashboard();
  return ok(res, "Dashboard retrieved successfully", data);
});

export const getClinicDashboard = asyncHandler(async (req: Request, res: Response) => {
  const clinicObjectId = new Types.ObjectId(param(req, "clinicId"));
  const [overview, followups] = await Promise.all([
    clinicDashboard(clinicObjectId),
    followupMetrics(clinicObjectId),
  ]);
  return ok(res, "Clinic dashboard retrieved successfully", { overview, followups });
});

export const listPayments = asyncHandler(async (req: Request, res: Response) => {
  const { skip, limit, page } = parsePagination(req.query as Record<string, unknown>);
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("clinicId", "name").lean(),
    Payment.countDocuments(filter),
  ]);
  const [paid] = await Payment.aggregate([
    { $match: { status: "PAID" } },
    { $group: { _id: null, total: { $sum: "$paidAmount" } } },
  ]);
  return ok(res, "Payments retrieved successfully", { items, total, page, limit, totalRevenue: paid?.total ?? 0 });
});

export const createPayment = asyncHandler(async (req: Request, res: Response) => {
  const payment = await Payment.create({
    ...req.body,
    clinicId: req.body.clinicId,
    subscriptionId: req.body.subscriptionId,
    dueDate: new Date(req.body.dueDate),
    paidAt: req.body.status === "PAID" ? new Date() : null,
    createdBy: new Types.ObjectId(req.authUser!.id),
  });
  await writeAuditLog({
    actorUserId: new Types.ObjectId(req.authUser!.id),
    action: "Updated Payment",
    module: "PAYMENT",
    clinicId: payment.clinicId,
    recordType: "Payment",
    recordId: payment._id,
    ipAddress: req.ip ?? "",
  });
  return ok(res, "Payment recorded successfully", { payment }, 201);
});

export const listSubscriptions = asyncHandler(async (req: Request, res: Response) => {
  const { skip, limit, page } = parsePagination(req.query as Record<string, unknown>);
  const [items, total] = await Promise.all([
    Subscription.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("clinicId", "name")
      .lean(),
    Subscription.countDocuments({ isDeleted: false }),
  ]);
  return ok(res, "Subscriptions retrieved successfully", { items, total, page, limit });
});

export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { skip, limit, page } = parsePagination(req.query as Record<string, unknown>);
  const [items, total] = await Promise.all([
    AuditLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actorUserId", "name email role")
      .populate("clinicId", "name")
      .lean(),
    AuditLog.countDocuments(),
  ]);
  return ok(res, "Audit logs retrieved successfully", { items, total, page, limit });
});

export const listSettings = asyncHandler(async (_req: Request, res: Response) => {
  const items = await SystemSetting.find().lean();
  return ok(res, "Settings retrieved successfully", { items });
});
