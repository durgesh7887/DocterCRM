import { Schema, model, type InferSchemaType } from "mongoose";
import { PAYMENT_STATUSES } from "../types/enums.js";
import { applyActorFields } from "./plugins.js";

const paymentSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0, default: 0 },
    status: { type: String, required: true, enum: PAYMENT_STATUSES, default: "PENDING", index: true },
    dueDate: { type: Date, required: true, index: true },
    paidAt: { type: Date, default: null },
    method: { type: String, default: "", trim: true },
    reference: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "payments" },
);

applyActorFields(paymentSchema);

paymentSchema.index({ clinicId: 1, status: 1, dueDate: 1 });
paymentSchema.index({ clinicId: 1, createdAt: -1 });

export type PaymentDocument = InferSchemaType<typeof paymentSchema> & { _id: Schema.Types.ObjectId };
export const Payment = model("Payment", paymentSchema);
