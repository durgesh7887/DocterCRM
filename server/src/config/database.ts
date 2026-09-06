import mongoose from "mongoose";

export async function connectDatabase(uri: string): Promise<typeof mongoose> {
  mongoose.set("strictQuery", true);
  return mongoose.connect(uri);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

export async function syncIndexes(): Promise<void> {
  const models = Object.values(mongoose.models);
  await Promise.all(models.map((model) => model.syncIndexes()));
}
