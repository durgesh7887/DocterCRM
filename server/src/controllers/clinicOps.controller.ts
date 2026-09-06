import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Appointment } from "../models/Appointment.js";
import { Consultation } from "../models/Consultation.js";
import { Family } from "../models/Family.js";
import { Followup } from "../models/Followup.js";
import { Patient } from "../models/Patient.js";
import { Visit } from "../models/Visit.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import {
  createPatient,
  findPatientsByMobile,
  searchPatients,
} from "../services/patientIdentity.service.js";
import { createConsultationWithFollowup, createVisit } from "../services/visit.service.js";
import { writeAuditLog } from "../services/audit.service.js";
import { ok, param, parsePagination } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";

function clinicId(req: Request) {
  return new Types.ObjectId(param(req, "clinicId"));
}

function actorId(req: Request) {
  return new Types.ObjectId(req.authUser!.id);
}

export const lookupPatients = asyncHandler(async (req: Request, res: Response) => {
  try {
    const mobile = String(req.query.mobile ?? "");
    const patients = await findPatientsByMobile(clinicId(req), mobile);
    return ok(res, "Patient lookup completed", { patients });
  } catch (error) {
    throw new AppError((error as Error).message, 400, "VALIDATION_ERROR");
  }
});

export const listPatients = asyncHandler(async (req: Request, res: Response) => {
  const { skip, limit, page } = parsePagination(req.query as Record<string, unknown>);
  const result = await searchPatients({
    clinicId: clinicId(req),
    query: String(req.query.q ?? ""),
    limit,
    skip,
  });
  return ok(res, "Patients retrieved successfully", { ...result, page });
});

export const createPatientHandler = asyncHandler(async (req: Request, res: Response) => {
  try {
    const patient = await createPatient({
      clinicId: clinicId(req),
      name: req.body.name,
      mobileNumber: req.body.mobileNumber,
      gender: req.body.gender,
      dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null,
      familyId: req.body.familyId ? new Types.ObjectId(req.body.familyId) : null,
      isMobileOwner: req.body.isMobileOwner,
      allowDuplicateMobile: req.body.allowDuplicateMobile,
      actorUserId: actorId(req),
    });
    if (req.body.notes) {
      patient.notes = req.body.notes;
      await patient.save();
    }
    await writeAuditLog({
      actorUserId: actorId(req),
      action: "Created Patient",
      module: "PATIENT",
      clinicId: clinicId(req),
      recordType: "Patient",
      recordId: patient._id,
      ipAddress: req.ip ?? "",
    });
    return ok(res, "Patient created successfully", { patient }, 201);
  } catch (error) {
    throw new AppError((error as Error).message, 409, "CONFLICT");
  }
});

export const getPatient = asyncHandler(async (req: Request, res: Response) => {
  const patient = await Patient.findOne({
    _id: param(req, "patientId"),
    clinicId: clinicId(req),
    isDeleted: false,
  }).lean();
  if (!patient) throw new AppError("Patient not found", 404, "NOT_FOUND");

  const [family, visits, consultations, followups, appointments] = await Promise.all([
    patient.familyId ? Family.findById(patient.familyId).lean() : null,
    Visit.find({ clinicId: clinicId(req), patientId: patient._id, isDeleted: false })
      .sort({ visitDate: -1 })
      .lean(),
    Consultation.find({ clinicId: clinicId(req), patientId: patient._id, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean(),
    Followup.find({ clinicId: clinicId(req), patientId: patient._id, isDeleted: false })
      .sort({ followupDate: -1 })
      .lean(),
    Appointment.find({ clinicId: clinicId(req), patientId: patient._id, isDeleted: false })
      .sort({ appointmentDate: -1 })
      .lean(),
  ]);

  return ok(res, "Patient retrieved successfully", {
    patient,
    family,
    visits,
    consultations,
    followups,
    appointments,
  });
});

export const createVisitHandler = asyncHandler(async (req: Request, res: Response) => {
  const patient = await Patient.findOne({
    _id: param(req, "patientId"),
    clinicId: clinicId(req),
    isDeleted: false,
  });
  if (!patient) throw new AppError("Patient not found", 404, "NOT_FOUND");

  const visit = await createVisit({
    clinicId: clinicId(req),
    patientId: patient._id,
    doctorId: req.body.doctorId ? new Types.ObjectId(req.body.doctorId) : null,
    visitDate: req.body.visitDate ? new Date(req.body.visitDate) : new Date(),
    visitType: req.body.visitType,
    chiefComplaint: req.body.chiefComplaint,
    actorUserId: actorId(req),
  });

  await writeAuditLog({
    actorUserId: actorId(req),
    action: "Created Visit",
    module: "VISIT",
    clinicId: clinicId(req),
    recordType: "Visit",
    recordId: visit._id,
    ipAddress: req.ip ?? "",
  });
  return ok(res, "Visit created successfully", { visit }, 201);
});

export const createConsultationHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await createConsultationWithFollowup({
    clinicId: clinicId(req),
    patientId: new Types.ObjectId(req.body.patientId),
    visitId: new Types.ObjectId(param(req, "visitId")),
    doctorId: req.body.doctorId ? new Types.ObjectId(req.body.doctorId) : null,
    chiefComplaint: req.body.chiefComplaint,
    symptoms: req.body.symptoms,
    problemDetails: req.body.problemDetails,
    diagnosis: req.body.diagnosis,
    notes: req.body.notes,
    followUpRequired: req.body.followUpRequired,
    followUpAfterDays: req.body.followUpAfterDays,
    actorUserId: actorId(req),
  });

  await writeAuditLog({
    actorUserId: actorId(req),
    action: "Created Consultation",
    module: "CONSULTATION",
    clinicId: clinicId(req),
    recordType: "Consultation",
    recordId: result.consultation._id,
    ipAddress: req.ip ?? "",
  });
  return ok(res, "Consultation created successfully", result, 201);
});

export const listFollowups = asyncHandler(async (req: Request, res: Response) => {
  const { skip, limit, page } = parsePagination(req.query as Record<string, unknown>);
  const filter: Record<string, unknown> = { clinicId: clinicId(req), isDeleted: false };
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Followup.find(filter)
      .sort({ followupDate: 1 })
      .skip(skip)
      .limit(limit)
      .populate("patientId", "name mobileNumber patientCode")
      .lean(),
    Followup.countDocuments(filter),
  ]);
  return ok(res, "Follow-ups retrieved successfully", { items, total, page, limit });
});

export const createFollowupHandler = asyncHandler(async (req: Request, res: Response) => {
  const cid = clinicId(req);
  const patient = await Patient.findOne({ _id: req.body.patientId, clinicId: cid, isDeleted: false });
  if (!patient) throw new AppError("Patient not found", 404, "NOT_FOUND");

  // Get a valid visitId — either provided or use the patient's last visit
  let visitId: Types.ObjectId;
  if (req.body.visitId) {
    visitId = new Types.ObjectId(req.body.visitId);
  } else {
    const lastVisit = await Visit.findOne({ clinicId: cid, patientId: patient._id, isDeleted: false })
      .sort({ visitDate: -1 })
      .lean();
    if (!lastVisit) throw new AppError("No visit found for patient — create a visit first", 400, "VALIDATION_ERROR");
    visitId = lastVisit._id;
  }

  const followupDate = new Date(req.body.followupDate);
  const followUpAfterDays = req.body.followUpAfterDays ?? 7;

  const followup = await Followup.create({
    clinicId: cid,
    patientId: patient._id,
    visitId,
    doctorId: req.body.doctorId ? new Types.ObjectId(req.body.doctorId) : null,
    followupDate,
    followUpAfterDays,
    notes: req.body.notes ?? "",
    status: followupDate <= new Date() ? "DUE" : "UPCOMING",
    createdBy: actorId(req),
  });

  await writeAuditLog({
    actorUserId: actorId(req),
    action: "Scheduled Follow-up",
    module: "FOLLOWUP",
    clinicId: cid,
    recordType: "Followup",
    recordId: followup._id,
    ipAddress: req.ip ?? "",
  });

  return ok(res, "Follow-up scheduled successfully", { followup }, 201);
});

export const completeFollowup = asyncHandler(async (req: Request, res: Response) => {
  const followup = await Followup.findOne({
    _id: param(req, "followupId"),
    clinicId: clinicId(req),
    isDeleted: false,
  });
  if (!followup) throw new AppError("Follow-up not found", 404, "NOT_FOUND");

  let visit = null;
  if (req.body.createVisit) {
    visit = await createVisit({
      clinicId: clinicId(req),
      patientId: followup.patientId,
      doctorId: followup.doctorId,
      visitType: "FOLLOW_UP",
      chiefComplaint: "Follow-up visit",
      actorUserId: actorId(req),
    });
  }

  followup.status = "COMPLETED";
  followup.completedAt = new Date();
  followup.completedVisitId = visit?._id ?? null;
  await followup.save();

  await writeAuditLog({
    actorUserId: actorId(req),
    action: "Completed Follow-up",
    module: "FOLLOWUP",
    clinicId: clinicId(req),
    recordType: "Followup",
    recordId: followup._id,
    ipAddress: req.ip ?? "",
  });
  return ok(res, "Follow-up completed", { followup, visit });
});

export const listAppointments = asyncHandler(async (req: Request, res: Response) => {
  const { skip, limit, page } = parsePagination(req.query as Record<string, unknown>);
  const filter: Record<string, unknown> = { clinicId: clinicId(req), isDeleted: false };
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Appointment.find(filter)
      .sort({ appointmentDate: 1 })
      .skip(skip)
      .limit(limit)
      .populate("patientId", "name mobileNumber patientCode")
      .populate("doctorId", "name")
      .lean(),
    Appointment.countDocuments(filter),
  ]);
  return ok(res, "Appointments retrieved successfully", { items, total, page, limit });
});

export const createAppointmentHandler = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await Appointment.create({
    clinicId: clinicId(req),
    patientId: req.body.patientId,
    doctorId: req.body.doctorId,
    appointmentDate: new Date(req.body.appointmentDate),
    notes: req.body.notes ?? "",
    durationMinutes: req.body.durationMinutes ?? 15,
    createdBy: actorId(req),
  });
  return ok(res, "Appointment created successfully", { appointment }, 201);
});

export const listClinicDoctors = asyncHandler(async (req: Request, res: Response) => {
  const { DoctorClinicAssignment } = await import("../models/ClinicAssignments.js");
  const rows = await DoctorClinicAssignment.find({
    clinicId: clinicId(req),
    isDeleted: false,
    status: "ACTIVE",
  }).lean();
  const doctors = await User.find({
    _id: { $in: rows.map((row) => row.userId) },
    isDeleted: false,
  })
    .select("name email doctorProfile status")
    .lean();
  return ok(res, "Doctors retrieved successfully", { items: doctors });
});

export const clinicReports = asyncHandler(async (req: Request, res: Response) => {
  const id = clinicId(req);
  const [patients, visits, followups, appointments] = await Promise.all([
    Patient.countDocuments({ clinicId: id, isDeleted: false }),
    Visit.countDocuments({ clinicId: id, isDeleted: false }),
    Followup.aggregate([
      { $match: { clinicId: id, isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Appointment.aggregate([
      { $match: { clinicId: id, isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);
  return ok(res, "Reports retrieved successfully", { patients, visits, followups, appointments });
});
