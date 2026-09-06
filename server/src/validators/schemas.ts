import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const clinicCreateSchema = z.object({
  name: z.string().min(2),
  ownerName: z.string().min(2),
  mobile: z.string().min(10),
  whatsappNumber: z.string().optional(),
  email: z.string().email(),
  city: z.string().optional(),
  state: z.string().optional(),
  gstin: z.string().optional(),
  receptionEnabled: z.boolean().optional(),
});

export const clinicUpdateSchema = clinicCreateSchema.partial();

export const settingsUpdateSchema = z.object({
  receptionEnabled: z.boolean().optional(),
  appointmentsEnabled: z.boolean().optional(),
  followupsEnabled: z.boolean().optional(),
  whatsappEnabled: z.boolean().optional(),
  reportsEnabled: z.boolean().optional(),
  multipleDoctorsEnabled: z.boolean().optional(),
  subscriptionsEnabled: z.boolean().optional(),
});

export const userCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "RECEPTION", "DOCTOR"]),
  mobileNumber: z.string().optional(),
  clinicId: z.string().optional(),
  specialization: z.string().optional(),
  registrationNumber: z.string().optional(),
});

export const passwordResetSchema = z.object({
  password: z.string().min(8),
});

export const patientCreateSchema = z.object({
  name: z.string().min(2),
  mobileNumber: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "UNSPECIFIED"]).optional(),
  dateOfBirth: z.string().optional(),
  familyId: z.string().nullable().optional(),
  isMobileOwner: z.boolean().optional(),
  allowDuplicateMobile: z.boolean().optional(),
  notes: z.string().optional(),
});

export const visitCreateSchema = z.object({
  doctorId: z.string().optional(),
  visitDate: z.string().optional(),
  visitType: z.enum(["WALK_IN", "FOLLOW_UP", "APPOINTMENT"]).optional(),
  chiefComplaint: z.string().optional(),
});

export const consultationCreateSchema = z.object({
  patientId: z.string(),
  doctorId: z.string().optional(),
  chiefComplaint: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
  problemDetails: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  followUpRequired: z.boolean().optional(),
  followUpAfterDays: z.number().int().min(1).optional(),
});

export const appointmentCreateSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  appointmentDate: z.string(),
  notes: z.string().optional(),
  durationMinutes: z.number().optional(),
});

export const paymentCreateSchema = z.object({
  clinicId: z.string(),
  subscriptionId: z.string(),
  amount: z.number().min(0),
  paidAmount: z.number().min(0),
  status: z.enum(["PAID", "PENDING", "OVERDUE", "PARTIAL"]),
  dueDate: z.string(),
  method: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const followupCreateSchema = z.object({
  patientId: z.string(),
  visitId: z.string(),
  doctorId: z.string().optional(),
  followupDate: z.string(),
  followUpAfterDays: z.number().int().min(1).default(7),
  notes: z.string().optional(),
});
