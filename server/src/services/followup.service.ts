import type { FollowupStatus } from "../types/enums.js";
import { addUtcDays, startOfUtcDay } from "../utils/dateAndIdentity.js";

export function calculateFollowupDate(visitDate: Date, afterDays: number): Date {
  if (afterDays < 1) {
    throw new Error("followUpAfterDays must be at least 1");
  }
  return addUtcDays(visitDate, afterDays);
}

export function classifyFollowupStatus(params: {
  storedStatus: FollowupStatus;
  followupDate: Date;
  now?: Date;
}): FollowupStatus {
  if (params.storedStatus === "COMPLETED" || params.storedStatus === "CANCELLED") {
    return params.storedStatus;
  }

  const today = startOfUtcDay(params.now ?? new Date());
  const due = startOfUtcDay(params.followupDate);

  if (due.getTime() > today.getTime()) {
    return "UPCOMING";
  }
  if (due.getTime() === today.getTime()) {
    return "DUE";
  }
  return "MISSED";
}
