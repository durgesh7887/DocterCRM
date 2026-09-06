import { Schema, model, type InferSchemaType } from "mongoose";

const counterSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { timestamps: true, collection: "counters" },
);

export type CounterDocument = InferSchemaType<typeof counterSchema> & { _id: Schema.Types.ObjectId };
export const Counter = model("Counter", counterSchema);
