import { Types } from "mongoose";
import { Family } from "../models/Family.js";
import { Patient } from "../models/Patient.js";
import { nextCode } from "./counter.service.js";
import { escapeRegex, normalizeMobile, requireNormalizedMobile } from "../utils/dateAndIdentity.js";
import type { Gender } from "../types/enums.js";

export async function findPatientsByMobile(clinicId: Types.ObjectId, mobile: string) {
  const mobileNumber = requireNormalizedMobile(mobile);
  return Patient.find({
    clinicId,
    mobileNumber,
    isDeleted: false,
  }).sort({ isMobileOwner: -1, createdAt: 1 });
}

export async function searchPatients(params: {
  clinicId: Types.ObjectId;
  query?: string;
  familyId?: Types.ObjectId;
  limit?: number;
  skip?: number;
}) {
  const filter: Record<string, unknown> = { clinicId: params.clinicId, isDeleted: false };

  if (params.familyId) {
    filter.familyId = params.familyId;
  }

  const query = params.query?.trim();
  if (query) {
    const mobile = normalizeMobile(query);
    const or: Record<string, unknown>[] = [
      { patientCode: new RegExp(`^${escapeRegex(query)}$`, "i") },
      { nameNormalized: new RegExp(escapeRegex(query.toLowerCase()), "i") },
    ];
    if (mobile) {
      or.push({ mobileNumber: mobile });
    }
    filter.$or = or;
  }

  const limit = Math.min(params.limit ?? 20, 100);
  const skip = params.skip ?? 0;

  const [items, total] = await Promise.all([
    Patient.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Patient.countDocuments(filter),
  ]);

  return { items, total, limit, skip };
}

export async function createPatient(params: {
  clinicId: Types.ObjectId;
  name: string;
  mobileNumber?: string | null;
  isMobileOwner?: boolean;
  gender?: Gender;
  dateOfBirth?: Date | null;
  familyId?: Types.ObjectId | null;
  actorUserId?: Types.ObjectId | null;
  allowDuplicateMobile?: boolean;
}) {
  const mobileNumber = params.mobileNumber ? requireNormalizedMobile(params.mobileNumber) : null;

  if (mobileNumber && params.isMobileOwner !== false && !params.allowDuplicateMobile) {
    const existing = await findPatientsByMobile(params.clinicId, mobileNumber);
    if (existing.length > 0) {
      throw new Error("Patient with this mobile number already exists in the clinic");
    }
  }

  const patientCode = await nextCode("P", params.clinicId);
  return Patient.create({
    clinicId: params.clinicId,
    familyId: params.familyId ?? null,
    patientCode,
    name: params.name.trim(),
    nameNormalized: params.name.trim().toLowerCase(),
    mobileNumber,
    isMobileOwner: params.isMobileOwner ?? Boolean(mobileNumber),
    gender: params.gender ?? "UNSPECIFIED",
    dateOfBirth: params.dateOfBirth ?? null,
    createdBy: params.actorUserId ?? null,
  });
}

export async function createFamily(params: {
  clinicId: Types.ObjectId;
  name: string;
  primaryMobile?: string | null;
  actorUserId?: Types.ObjectId | null;
}) {
  return Family.create({
    clinicId: params.clinicId,
    name: params.name.trim(),
    primaryMobile: params.primaryMobile ? requireNormalizedMobile(params.primaryMobile) : null,
    createdBy: params.actorUserId ?? null,
  });
}
