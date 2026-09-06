import { Types } from "mongoose";
import { Counter } from "../models/Counter.js";

export async function nextSequence(key: string): Promise<number> {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );

  return counter.seq;
}

export async function nextCode(prefix: string, clinicId: Types.ObjectId, pad = 5): Promise<string> {
  const seq = await nextSequence(`${prefix}:${clinicId.toString()}`);
  return `${prefix}-${String(seq).padStart(pad, "0")}`;
}
