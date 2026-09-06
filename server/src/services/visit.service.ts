import { Types } from "mongoose";
import { Consultation } from "../models/Consultation.js";
import { Followup } from "../models/Followup.js";
import { Patient } from "../models/Patient.js";
import { Visit } from "../models/Visit.js";
import { calculateFollowupDate, classifyFollowupStatus } from "./followup.service.js";
import { nextCode } from "./counter.service.js";
import type { VisitType } from "../types/enums.js";

export async function createVisit(params: {
  clinicId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId?: Types.ObjectId | null;
  visitDate?: Date;
  visitType?: VisitType;
  chiefComplaint?: string;
  appointmentId?: Types.ObjectId | null;
  actorUserId?: Types.ObjectId | null;
}) {
  const visitDate = params.visitDate ?? new Date();
  const visit = await Visit.create({
    clinicId: params.clinicId,
    patientId: params.patientId,
    doctorId: params.doctorId ?? null,
    appointmentId: params.appointmentId ?? null,
    visitCode: await nextCode("V", params.clinicId),
    visitDate,
    visitType: params.visitType ?? "WALK_IN",
    status: "OPEN",
    chiefComplaint: params.chiefComplaint ?? "",
    createdBy: params.actorUserId ?? null,
  });

  await Patient.updateOne(
    { _id: params.patientId, clinicId: params.clinicId },
    { $set: { lastVisitAt: visitDate } },
  );

  return visit;
}

export async function createConsultationWithFollowup(params: {
  clinicId: Types.ObjectId;
  patientId: Types.ObjectId;
  visitId: Types.ObjectId;
  doctorId?: Types.ObjectId | null;
  chiefComplaint?: string;
  symptoms?: string[];
  problemDetails?: string;
  diagnosis?: string;
  notes?: string;
  followUpRequired?: boolean;
  followUpAfterDays?: number | null;
  actorUserId?: Types.ObjectId | null;
  now?: Date;
}) {
  const visit = await Visit.findOne({
    _id: params.visitId,
    clinicId: params.clinicId,
    patientId: params.patientId,
    isDeleted: false,
  });

  if (!visit) {
    throw new Error("Visit not found in clinic");
  }

  const consultation = await Consultation.create({
    clinicId: params.clinicId,
    patientId: params.patientId,
    visitId: params.visitId,
    doctorId: params.doctorId ?? visit.doctorId,
    chiefComplaint: params.chiefComplaint ?? visit.chiefComplaint,
    symptoms: params.symptoms ?? [],
    problemDetails: params.problemDetails ?? "",
    diagnosis: params.diagnosis ?? "",
    notes: params.notes ?? "",
    followUpRequired: params.followUpRequired ?? false,
    followUpAfterDays: params.followUpAfterDays ?? null,
    createdBy: params.actorUserId ?? null,
  });

  let followup = null;
  if (params.followUpRequired && params.followUpAfterDays) {
    const followupDate = calculateFollowupDate(visit.visitDate, params.followUpAfterDays);
    const status = classifyFollowupStatus({
      storedStatus: "UPCOMING",
      followupDate,
      now: params.now ?? new Date(),
    });

    followup = await Followup.create({
      clinicId: params.clinicId,
      patientId: params.patientId,
      visitId: params.visitId,
      consultationId: consultation._id,
      doctorId: params.doctorId ?? visit.doctorId,
      followupDate,
      followUpAfterDays: params.followUpAfterDays,
      status,
      createdBy: params.actorUserId ?? null,
    });
  }

  await Visit.updateOne(
    { _id: visit._id },
    { $set: { status: "COMPLETED", updatedBy: params.actorUserId ?? null } },
  );

  return { consultation, followup };
}
