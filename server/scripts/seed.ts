import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase, syncIndexes } from "../src/config/database.js";
import { seedPhase1Scenario } from "../src/database/seedPhase1.js";
import "../src/models/index.js";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/medflow";

async function main() {
  await connectDatabase(uri);
  await syncIndexes();
  const seeded = await seedPhase1Scenario();
  console.log("Phase 1 seed complete");
  console.log({
    superAdmin: seeded.superAdmin.email,
    clinicA: seeded.clinicA.name,
    clinicB: seeded.clinicB.name,
    patient: seeded.father.patientCode,
    visits: [seeded.visit1.visitCode, seeded.visit2.visitCode],
  });
  await disconnectDatabase();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
