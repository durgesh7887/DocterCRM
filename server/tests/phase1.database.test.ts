import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connectDatabase, disconnectDatabase, syncIndexes } from "../src/config/database.js";
import { seedPhase1Scenario } from "../src/database/seedPhase1.js";
import { Appointment } from "../src/models/Appointment.js";
import { AuditLog } from "../src/models/AuditLog.js";
import { ClinicSettings } from "../src/models/ClinicSettings.js";
import { Consultation } from "../src/models/Consultation.js";
import { Followup } from "../src/models/Followup.js";
import { Patient } from "../src/models/Patient.js";
import { Payment } from "../src/models/Payment.js";
import { Role } from "../src/models/Role.js";
import { User } from "../src/models/User.js";
import { Visit } from "../src/models/Visit.js";
import { assertClinicAccess, getAssignedClinicIds } from "../src/services/assignment.service.js";
import { createPatient, findPatientsByMobile } from "../src/services/patientIdentity.service.js";
import { calculateFollowupDate, classifyFollowupStatus } from "../src/services/followup.service.js";
import { createVisit } from "../src/services/visit.service.js";
import "../src/models/index.js";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await connectDatabase(mongod.getUri());
  await syncIndexes();
  await seedPhase1Scenario();
});

afterAll(async () => {
  await disconnectDatabase();
  await mongod.stop();
});

describe("MedFlow Phase 1 database foundation", () => {
  it("seeds catalog, clinics, users, assignments, clinical data, payments and audit logs", async () => {
    expect(await Role.countDocuments()).toBe(4);
    expect(await User.countDocuments({ isDeleted: false })).toBe(5);
    expect(await ClinicSettings.countDocuments()).toBe(2);
    expect(await AuditLog.countDocuments()).toBeGreaterThanOrEqual(3);
    expect(await Appointment.countDocuments()).toBe(1);
    expect(await Payment.countDocuments()).toBe(2);

    const passwordOnDefaultQuery = await User.findOne({ email: "superadmin@medflow.local" });
    expect(passwordOnDefaultQuery?.passwordHash).toBeUndefined();

    const withSecret = await User.findOne({ email: "superadmin@medflow.local" }).select("+passwordHash");
    expect(withSecret?.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(withSecret?.passwordHash).not.toContain("ChangeMe!MedFlow1");

    const followup = await Followup.findOne({ followUpAfterDays: 7 });
    const father = await Patient.findOne({ name: "Ramesh Sharma" });
    const daughter = await Patient.findOne({ name: "Ananya Sharma" });
    expect(followup?.followupDate.toISOString().startsWith("2026-08-16")).toBe(true);
    expect(followup?.status).toBe("UPCOMING");
    expect(father?._id.equals(daughter!._id)).toBe(false);
    expect(father?.familyId).toBeTruthy();
    expect(father?.familyId?.equals(daughter!.familyId!)).toBe(true);
  });

  it("does not create a duplicate patient on repeat mobile lookup; preserves visit history", async () => {
    const clinicA = await mongoose.model("Clinic").findOne({ name: "MedFlow Clinic A" });
    const matches = await findPatientsByMobile(clinicA!._id, "+91 98765 43210");
    expect(matches.map((patient) => patient.name).sort()).toEqual(["Ananya Sharma", "Ramesh Sharma"]);

    const primary = matches.find((patient) => patient.isMobileOwner);
    expect(primary?.name).toBe("Ramesh Sharma");

    await expect(
      createPatient({
        clinicId: clinicA!._id,
        name: "Duplicate Ramesh",
        mobileNumber: "9876543210",
      }),
    ).rejects.toThrow(/already exists/);

    const visits = await Visit.find({ clinicId: clinicA!._id, patientId: primary!._id, isDeleted: false }).sort({
      visitDate: 1,
    });
    expect(visits).toHaveLength(2);
    expect(visits[0]?.visitCode).not.toBe(visits[1]?.visitCode);

    const consultations = await Consultation.find({ patientId: primary!._id, isDeleted: false });
    expect(consultations).toHaveLength(2);
  });

  it("keeps clinic data isolated by clinicId and assignment", async () => {
    const clinicA = await mongoose.model("Clinic").findOne({ name: "MedFlow Clinic A" });
    const clinicB = await mongoose.model("Clinic").findOne({ name: "MedFlow Clinic B" });
    const adminA = await User.findOne({ email: "admin.a@medflow.local" });
    const adminB = await User.findOne({ email: "admin.b@medflow.local" });

    const adminAClinics = await getAssignedClinicIds("ADMIN", adminA!._id);
    const adminBClinics = await getAssignedClinicIds("ADMIN", adminB!._id);

    expect(adminAClinics).toHaveLength(1);
    expect(adminAClinics[0]?.equals(clinicA!._id)).toBe(true);
    expect(() => assertClinicAccess(adminAClinics, clinicB!._id)).toThrow(/Clinic access denied/);
    expect(() => assertClinicAccess(adminBClinics, clinicA!._id)).toThrow(/Clinic access denied/);

    const clinicBMatches = await findPatientsByMobile(clinicB!._id, "9876543210");
    expect(clinicBMatches).toHaveLength(0);

    const leaked = await Patient.countDocuments({
      clinicId: clinicB!._id,
      mobileNumber: "9876543210",
    });
    expect(leaked).toBe(0);

    await createPatient({
      clinicId: clinicB!._id,
      name: "Ramesh Sharma",
      mobileNumber: "9876543210",
    });
    expect(await Patient.countDocuments({ mobileNumber: "9876543210", isDeleted: false })).toBe(3);
  });

  it("classifies follow-ups and keeps payment history append-only", async () => {
    expect(calculateFollowupDate(new Date("2026-08-09T10:00:00.000Z"), 7).toISOString()).toBe(
      "2026-08-16T00:00:00.000Z",
    );
    expect(
      classifyFollowupStatus({
        storedStatus: "UPCOMING",
        followupDate: new Date("2026-08-16T00:00:00.000Z"),
        now: new Date("2026-08-16T08:00:00.000Z"),
      }),
    ).toBe("DUE");
    expect(
      classifyFollowupStatus({
        storedStatus: "UPCOMING",
        followupDate: new Date("2026-08-16T00:00:00.000Z"),
        now: new Date("2026-08-20T08:00:00.000Z"),
      }),
    ).toBe("MISSED");
    expect(
      classifyFollowupStatus({
        storedStatus: "COMPLETED",
        followupDate: new Date("2026-08-16T00:00:00.000Z"),
        now: new Date("2026-08-20T08:00:00.000Z"),
      }),
    ).toBe("COMPLETED");

    const pending = await Payment.findOne({ status: "PENDING" });
    expect(pending).toBeTruthy();
    await Payment.create({
      clinicId: pending!.clinicId,
      subscriptionId: pending!.subscriptionId,
      amount: pending!.amount,
      paidAmount: 2000,
      status: "PARTIAL",
      dueDate: pending!.dueDate,
      notes: "Partial collection — original PENDING row retained",
    });
    expect(await Payment.countDocuments()).toBe(3);

    const settings = await ClinicSettings.findOne({ receptionEnabled: false }).populate("clinicId");
    expect(settings).toBeTruthy();
  });

  it("creates a new visit under the same patient without overwriting the first visit", async () => {
    const clinicA = await mongoose.model("Clinic").findOne({ name: "MedFlow Clinic A" });
    const [primary] = await findPatientsByMobile(clinicA!._id, "9876543210");
    const before = await Visit.findById(
      (await Visit.find({ patientId: primary!._id }).sort({ visitDate: 1 }).limit(1))[0]?._id,
    );

    await createVisit({
      clinicId: clinicA!._id,
      patientId: primary!._id,
      visitDate: new Date("2026-08-25T04:00:00.000Z"),
      chiefComplaint: "New complaint",
    });

    const after = await Visit.findById(before!._id);
    expect(after?.chiefComplaint).toBe(before?.chiefComplaint);
    expect(await Visit.countDocuments({ patientId: primary!._id, isDeleted: false })).toBe(3);
    expect(await Followup.countDocuments({ patientId: primary!._id })).toBe(1);
  });
});
