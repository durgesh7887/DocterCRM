import { Schema, model, type InferSchemaType } from "mongoose";
import { BILLING_CYCLES, SUBSCRIPTION_STATUSES } from "../types/enums.js";
import { applyActorFields, applySoftDelete } from "./plugins.js";

const subscriptionSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    planName: { type: String, required: true, trim: true },
    planCode: { type: String, required: true, trim: true, uppercase: true },
    amount: { type: Number, required: true, min: 0 },
    billingCycle: { type: String, required: true, enum: BILLING_CYCLES },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    nextDueDate: { type: Date, required: true, index: true },
    status: { type: String, required: true, enum: SUBSCRIPTION_STATUSES, default: "ACTIVE", index: true },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "subscriptions" },
);

applySoftDelete(subscriptionSchema);
applyActorFields(subscriptionSchema);

subscriptionSchema.index({ clinicId: 1, status: 1, isDeleted: 1 });
subscriptionSchema.index({ clinicId: 1, createdAt: -1 });

export type SubscriptionDocument = InferSchemaType<typeof subscriptionSchema> & {
  _id: Schema.Types.ObjectId;
};
export const Subscription = model("Subscription", subscriptionSchema);
