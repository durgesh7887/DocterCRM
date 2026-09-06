import { Appointment } from "../models/Appointment.js";
import { Payment } from "../models/Payment.js";
import { Subscription } from "../models/Subscription.js";
import { writeAuditLog } from "../services/audit.service.js";
import { assignUserToClinic } from "../services/assignment.service.js";
import {
  createFamily,
  createPatient,
  findPatientsByMobile,
} from "../services/patientIdentity.service.js";
import { createConsultationWithFollowup, createVisit } from "../services/visit.service.js";
import { createClinic, createUser } from "../test/factories.js";
import { seedCatalog } from "./seedCatalog.js";

export type Phase1SeedResult = Awaited<ReturnType<typeof seedPhase1Scenario>>;

export async function seedPhase1Scenario(password = "ChangeMe!MedFlow1") {
  await seedCatalog();

  const superAdmin = await createUser({
    name: "Super Admin",
    email: "superadmin@medflow.local",
    password,
    role: "SUPER_ADMIN",
    mobileNumber: "9000000001",
  });

  const clinicA = await createClinic({
    name: "MedFlow Clinic A",
    ownerName: "Dr. Asha Rao",
    mobile: "9800000001",
    email: "clinica@medflow.local",
    city: "Bengaluru",
    state: "Karnataka",
    receptionEnabled: true,
  });

  const clinicB = await createClinic({
    name: "MedFlow Clinic B",
    ownerName: "Dr. Bharat Shah",
    mobile: "9800000002",
    email: "clinicb@medflow.local",
    city: "Pune",
    state: "Maharashtra",
    receptionEnabled: false,
  });

  const adminA = await createUser({
    name: "Admin A",
    email: "admin.a@medflow.local",
    password,
    role: "ADMIN",
    mobileNumber: "9000000011",
  });
  const adminB = await createUser({
    name: "Admin B",
    email: "admin.b@medflow.local",
    password,
    role: "ADMIN",
    mobileNumber: "9000000012",
  });
  const doctorA = await createUser({
    name: "Dr. Kavya Menon",
    email: "doctor.a@medflow.local",
    password,
    role: "DOCTOR",
    mobileNumber: "9000000021",
    specialization: "General Medicine",
    registrationNumber: "KMC-10021",
  });
  const receptionA = await createUser({
    name: "Reception A",
    email: "reception.a@medflow.local",
    password,
    role: "RECEPTION",
    mobileNumber: "9000000031",
  });

  await assignUserToClinic({
    role: "ADMIN",
    userId: adminA._id,
    clinicId: clinicA._id,
    actorUserId: superAdmin._id,
    isPrimary: true,
  });
  await assignUserToClinic({
    role: "ADMIN",
    userId: adminB._id,
    clinicId: clinicB._id,
    actorUserId: superAdmin._id,
    isPrimary: true,
  });
  await assignUserToClinic({
    role: "DOCTOR",
    userId: doctorA._id,
    clinicId: clinicA._id,
    actorUserId: superAdmin._id,
    isPrimary: true,
  });
  await assignUserToClinic({
    role: "RECEPTION",
    userId: receptionA._id,
    clinicId: clinicA._id,
    actorUserId: superAdmin._id,
    isPrimary: true,
  });

  const family = await createFamily({
    clinicId: clinicA._id,
    name: "Sharma Family",
    primaryMobile: "9876543210",
    actorUserId: receptionA._id,
  });

  const father = await createPatient({
    clinicId: clinicA._id,
    name: "Ramesh Sharma",
    mobileNumber: "9876543210",
    gender: "MALE",
    familyId: family._id,
    actorUserId: receptionA._id,
  });
  const daughter = await createPatient({
    clinicId: clinicA._id,
    name: "Ananya Sharma",
    mobileNumber: "9876543210",
    gender: "FEMALE",
    familyId: family._id,
    isMobileOwner: false,
    allowDuplicateMobile: true,
    actorUserId: receptionA._id,
  });

  const visit1 = await createVisit({
    clinicId: clinicA._id,
    patientId: father._id,
    doctorId: doctorA._id,
    visitDate: new Date("2026-08-09T04:00:00.000Z"),
    chiefComplaint: "Fever",
    actorUserId: receptionA._id,
  });
  const consult1 = await createConsultationWithFollowup({
    clinicId: clinicA._id,
    patientId: father._id,
    visitId: visit1._id,
    doctorId: doctorA._id,
    chiefComplaint: "Fever",
    symptoms: ["fever", "body ache"],
    problemDetails: "3 days of fever",
    diagnosis: "Viral fever",
    notes: "Rest and fluids",
    followUpRequired: true,
    followUpAfterDays: 7,
    actorUserId: receptionA._id,
    now: new Date("2026-08-09T04:00:00.000Z"),
  });

  const existing = await findPatientsByMobile(clinicA._id, "9876543210");
  const returning = existing[0];
  const visit2 = await createVisit({
    clinicId: clinicA._id,
    patientId: returning._id,
    doctorId: doctorA._id,
    visitDate: new Date("2026-08-20T04:00:00.000Z"),
    visitType: "FOLLOW_UP",
    chiefComplaint: "Follow-up after fever",
    actorUserId: receptionA._id,
  });
  await createConsultationWithFollowup({
    clinicId: clinicA._id,
    patientId: returning._id,
    visitId: visit2._id,
    doctorId: doctorA._id,
    diagnosis: "Recovered",
    followUpRequired: false,
    actorUserId: receptionA._id,
  });

  await Appointment.create({
    clinicId: clinicA._id,
    patientId: father._id,
    doctorId: doctorA._id,
    appointmentDate: new Date("2026-08-28T04:30:00.000Z"),
    status: "SCHEDULED",
    notes: "Review",
    createdBy: receptionA._id,
  });

  const subscription = await Subscription.create({
    clinicId: clinicA._id,
    planName: "Standard",
    planCode: "STD",
    amount: 4999,
    billingCycle: "MONTHLY",
    startDate: new Date("2026-08-01T00:00:00.000Z"),
    nextDueDate: new Date("2026-09-01T00:00:00.000Z"),
    status: "ACTIVE",
    createdBy: superAdmin._id,
  });

  clinicA.currentSubscriptionId = subscription._id;
  await clinicA.save();

  await Payment.create({
    clinicId: clinicA._id,
    subscriptionId: subscription._id,
    amount: 4999,
    paidAmount: 4999,
    status: "PAID",
    dueDate: new Date("2026-08-01T00:00:00.000Z"),
    paidAt: new Date("2026-08-01T06:00:00.000Z"),
    method: "UPI",
    reference: "PAY-SEED-001",
    createdBy: superAdmin._id,
  });
  await Payment.create({
    clinicId: clinicA._id,
    subscriptionId: subscription._id,
    amount: 4999,
    paidAmount: 0,
    status: "PENDING",
    dueDate: new Date("2026-09-01T00:00:00.000Z"),
    createdBy: superAdmin._id,
  });

  await writeAuditLog({
    actorUserId: superAdmin._id,
    action: "Created Clinic",
    module: "CLINIC",
    clinicId: clinicA._id,
    recordType: "Clinic",
    recordId: clinicA._id,
  });
  await writeAuditLog({
    actorUserId: receptionA._id,
    action: "Created Patient",
    module: "PATIENT",
    clinicId: clinicA._id,
    recordType: "Patient",
    recordId: father._id,
  });
  await writeAuditLog({
    actorUserId: receptionA._id,
    action: "Created Consultation",
    module: "CONSULTATION",
    clinicId: clinicA._id,
    recordType: "Consultation",
    recordId: consult1.consultation._id,
  });

  return {
    superAdmin,
    clinicA,
    clinicB,
    adminA,
    adminB,
    doctorA,
    receptionA,
    family,
    father,
    daughter,
    visit1,
    visit2,
    followup: consult1.followup,
    subscription,
  };
}
