import { Schema, model, type InferSchemaType } from "mongoose";
import { NOTIFICATION_CHANNELS, NOTIFICATION_STATUSES } from "../types/enums.js";

const notificationSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", default: null, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", default: null, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    channel: { type: String, required: true, enum: NOTIFICATION_CHANNELS },
    templateKey: { type: String, required: true, trim: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    scheduledFor: { type: Date, default: null, index: true },
    status: { type: String, required: true, enum: NOTIFICATION_STATUSES, default: "QUEUED", index: true },
    errorMessage: { type: String, default: "" },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "notifications" },
);

notificationSchema.index({ status: 1, scheduledFor: 1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema> & {
  _id: Schema.Types.ObjectId;
};
export const Notification = model("Notification", notificationSchema);
