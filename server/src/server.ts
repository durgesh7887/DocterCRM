import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "./app.js";
import { connectDatabase, syncIndexes } from "./config/database.js";
import { env } from "./config/env.js";
import { seedPhase1Scenario } from "./database/seedPhase1.js";
import { User } from "./models/User.js";
import "./models/index.js";

async function connectWithFallback() {
  try {
    await connectDatabase(env.mongodbUri);
    console.log(`MongoDB connected: ${env.mongodbUri}`);
  } catch (error) {
    console.warn("Local MongoDB unavailable, starting in-memory MongoDB", error);
    const memory = await MongoMemoryServer.create();
    await connectDatabase(memory.getUri());
    console.log("In-memory MongoDB ready");
  }
}

async function seedIfEmpty() {
  const count = await User.countDocuments();
  if (count === 0) {
    await seedPhase1Scenario();
    console.log("Seeded Phase 1 demo data (password: ChangeMe!MedFlow1)");
  }
}

async function main() {
  await connectWithFallback();
  await syncIndexes();
  await seedIfEmpty();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`MedFlow API listening on http://localhost:${env.port}`);
  });
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
