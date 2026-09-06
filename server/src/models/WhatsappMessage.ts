import { Schema, model, type InferSchemaType } from "mongoose";
import { WHATSAPP_MESSAGE_STATUSES } from "../types/enums.js";

const whatsappMessageSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    notificationId: { type: Schema.Types.ObjectId, ref: "Notification", default: null },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", default: null },
    toMobile: { type: String, required: true, trim: true },
    templateKey: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    providerMessageId: { type: String, default: "", index: true },
    status: { type: String, required: true, enum: WHATSAPP_MESSAGE_STATUSES, default: "QUEUED", index: true },
    errorMessage: { type: String, default: "" },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "whatsappMessages" },
);

whatsappMessageSchema.index({ clinicId: 1, createdAt: -1 });
whatsappMessageSchema.index({ status: 1, createdAt: 1 });

export type WhatsappMessageDocument = InferSchemaType<typeof whatsappMessageSchema> & {
  _id: Schema.Types.ObjectId;
};
export const WhatsappMessage = model("WhatsappMessage", whatsappMessageSchema);
