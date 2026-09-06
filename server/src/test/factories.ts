import { Clinic } from "../models/Clinic.js";
import { ClinicSettings } from "../models/ClinicSettings.js";
import { User } from "../models/User.js";
import type { UserRole } from "../types/enums.js";
import { normalizeMobile } from "../utils/dateAndIdentity.js";
import { hashPassword } from "../utils/password.js";

export { hashPassword };

export async function createUser(params: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  mobileNumber?: string;
  specialization?: string;
  registrationNumber?: string;
}) {
  return User.create({
    name: params.name,
    email: params.email.toLowerCase(),
    mobileNumber: params.mobileNumber ? normalizeMobile(params.mobileNumber) : null,
    passwordHash: await hashPassword(params.password),
    role: params.role,
    status: "ACTIVE",
    doctorProfile:
      params.role === "DOCTOR"
        ? {
            specialization: params.specialization ?? "",
            registrationNumber: params.registrationNumber ?? "",
          }
        : undefined,
  });
}

export async function createClinic(params: {
  name: string;
  ownerName: string;
  mobile: string;
  email: string;
  city?: string;
  state?: string;
  receptionEnabled?: boolean;
}) {
  const clinic = await Clinic.create({
    name: params.name,
    ownerName: params.ownerName,
    mobile: normalizeMobile(params.mobile) ?? params.mobile,
    email: params.email.toLowerCase(),
    address: { city: params.city ?? "", state: params.state ?? "", country: "India" },
    status: "ACTIVE",
  });

  await ClinicSettings.create({
    clinicId: clinic._id,
    receptionEnabled: params.receptionEnabled ?? true,
  });

  return clinic;
}
