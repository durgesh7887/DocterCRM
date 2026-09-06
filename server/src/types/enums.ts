export const USER_ROLES = ["SUPER_ADMIN", "ADMIN", "RECEPTION", "DOCTOR"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const CLINIC_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type ClinicStatus = (typeof CLINIC_STATUSES)[number];

export const GENDERS = ["MALE", "FEMALE", "OTHER", "UNSPECIFIED"] as const;
export type Gender = (typeof GENDERS)[number];

export const VISIT_TYPES = ["WALK_IN", "FOLLOW_UP", "APPOINTMENT"] as const;
export type VisitType = (typeof VISIT_TYPES)[number];

export const VISIT_STATUSES = ["OPEN", "COMPLETED", "CANCELLED"] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

export const FOLLOWUP_STATUSES = [
  "UPCOMING",
  "DUE",
  "COMPLETED",
  "MISSED",
  "CANCELLED",
] as const;
export type FollowupStatus = (typeof FOLLOWUP_STATUSES)[number];

export const APPOINTMENT_STATUSES = [
  "SCHEDULED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "MISSED",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const BILLING_CYCLES = ["MONTHLY", "QUARTERLY", "YEARLY"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const SUBSCRIPTION_STATUSES = [
  "TRIAL",
  "ACTIVE",
  "PAST_DUE",
  "EXPIRED",
  "CANCELLED",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const PAYMENT_STATUSES = ["PAID", "PENDING", "OVERDUE", "PARTIAL"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const NOTIFICATION_CHANNELS = ["WHATSAPP", "EMAIL", "SMS", "IN_APP"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_STATUSES = [
  "QUEUED",
  "SENT",
  "FAILED",
  "CANCELLED",
] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const WHATSAPP_MESSAGE_STATUSES = [
  "QUEUED",
  "SENT",
  "DELIVERED",
  "READ",
  "FAILED",
] as const;
export type WhatsappMessageStatus = (typeof WHATSAPP_MESSAGE_STATUSES)[number];

export const AUDIT_MODULES = [
  "AUTH",
  "CLINIC",
  "USER",
  "ASSIGNMENT",
  "PATIENT",
  "FAMILY",
  "VISIT",
  "CONSULTATION",
  "FOLLOWUP",
  "APPOINTMENT",
  "SUBSCRIPTION",
  "PAYMENT",
  "SETTINGS",
  "SYSTEM",
] as const;
export type AuditModule = (typeof AUDIT_MODULES)[number];
