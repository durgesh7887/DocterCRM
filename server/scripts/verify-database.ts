import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { Clinic } from "../src/models/Clinic.js";
import { Patient } from "../src/models/Patient.js";
import { Visit } from "../src/models/Visit.js";
import { findPatientsByMobile } from "../src/services/patientIdentity.service.js";
import "../src/models/index.js";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/medflow";

async function main() {
  await connectDatabase(uri);
  const clinicA = await Clinic.findOne({ name: "MedFlow Clinic A", isDeleted: false });
  if (!clinicA) {
    throw new Error("Seed data not found. Run npm run seed first.");
  }

  const matches = await findPatientsByMobile(clinicA._id, "9876543210");
  const visits = await Visit.countDocuments({ clinicId: clinicA._id, patientId: matches[0]?._id });
  const leaked = await Patient.countDocuments({
    clinicId: { $ne: clinicA._id },
    _id: matches[0]?._id,
  });

  console.log({
    mobileMatches: matches.length,
    visitsForPrimaryPatient: visits,
    patientLeakedToOtherClinic: leaked,
  });

  if (matches.length < 1 || visits < 2 || leaked !== 0) {
    throw new Error("Live database verification failed");
  }

  console.log("Live database verification passed");
  await disconnectDatabase();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
