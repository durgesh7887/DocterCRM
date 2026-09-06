# MASTER_DATABASE.md

Last updated: 2026-08-27  
Phase: 1 (implemented)

## Design principles

- Clinic-scoped operational data. Almost every clinical or billing document includes `clinicId`.
- References for independently queried or high-volume data (patients, visits, consultations, follow-ups, appointments, payments).
- Embedding for tightly coupled value objects (address, tax, vitals, doctorProfile).
- Soft delete (`isDeleted`, `deletedAt`, `deletedBy`) on mutable operational collections. Audit logs and payments are append-oriented and are not soft-deleted.
- `createdAt` / `updatedAt` via Mongoose timestamps. Audit logs are create-only.
- Unique constraints use partial indexes so soft-deleted rows do not block reuse.

## Patient identity model

Patients are **clinic-scoped**. The same mobile number at Clinic A and Clinic B is two patient records. This preserves clinic isolation.

Within a clinic:

- Lookup key is a normalized 10-digit `mobileNumber`.
- Index: `{ clinicId: 1, mobileNumber: 1, isDeleted: 1 }` (non-unique).
- Application rule: if Reception searches a mobile and one or more patients exist, do **not** auto-create. Create only when the clinic has no match, or when adding a family member with `allowDuplicateMobile` / `isMobileOwner: false`.
- Family members are separate `patients` rows sharing `familyId`. They may share a mobile. The member who owns the phone has `isMobileOwner: true`.
- Database identity is MongoDB `_id`. Human code is clinic-scoped `patientCode` (`P-00001`).

Do not treat mobile as globally unique.

## Embedding vs referencing

| Embedded | Referenced |
| --- | --- |
| Clinic `address`, `tax` | Clinic ← Patients, Visits, Staff assignments |
| Patient `address` | Patient ← Visits, Consultations, Follow-ups, Appointments |
| Consultation `vitals`, `symptoms[]` | Visit 1:1 Consultation (`visitId` unique) |
| User `doctorProfile` | User ↔ clinic via assignment collections |
| Notification `payload` | Subscription ← Payments (history rows) |

Visit and consultation are separate collections because consultations are independently listed and updated under controlled rules, while visits represent the encounter timeline.

## Collections

### users

Auth identity. One role per user (`SUPER_ADMIN`, `ADMIN`, `RECEPTION`, `DOCTOR`).

- Unique: `email` (active rows), `mobileNumber` when present (active rows)
- `passwordHash` is `select: false`
- Super Admin is not assigned via clinic assignment collections

### roles / permissions

Permission catalog and role → permission keys. Users store `role` as an enum for query speed; `roles` is the permission source of truth for Phase 2 RBAC.

### refreshTokens

Prepared for Phase 2. `tokenHash` unique. TTL index on `expiresAt`.

### clinics

Clinic master data, status, timezone, `currentSubscriptionId`.

### clinicSettings (1:1 clinic)

Feature toggles. `receptionEnabled` drives receptionless-clinic workflow later. Toggles never replace authorization.

### adminClinicAssignments / doctorClinicAssignments / receptionClinicAssignments

Explicit access. Unique `{ userId, clinicId }` among active rows.

### families / patients

See identity model. Patients optionally belong to a family.

### visits / consultations / followups / appointments

Encounter, clinical note, dated follow-up, scheduled appointment. Follow-up `status`: `UPCOMING`, `DUE`, `COMPLETED`, `MISSED`, `CANCELLED`. Stored status is classified from `followupDate` unless completed or cancelled.

Follow-up date = UTC date of visit + `followUpAfterDays`. Example: visit 9 Aug + 7 days → 16 Aug.

### subscriptions / payments

Current subscription referenced from clinic. Payments are immutable history. New status events are new documents. Statuses: `PAID`, `PENDING`, `OVERDUE`, `PARTIAL`.

### notifications / whatsappMessages

Queued messaging. No provider calls in Phase 1.

### auditLogs

Append-only. Actor, action, module, clinic, record, metadata, IP, user agent.

### systemSettings / counters

Global key/value settings. Atomic sequences for `P-` and `V-` codes per clinic.

## Indexes (implemented)

Query-driven, not one index per field.

- users: `{ email }` unique partial; `{ mobileNumber }` unique partial; `{ role, status, isDeleted }`
- clinics: `{ status, isDeleted }`, `{ name, isDeleted }`
- assignments: `{ userId, clinicId }` unique partial; `{ clinicId, status, isDeleted }`
- patients: `{ clinicId, patientCode }` unique partial; `{ clinicId, mobileNumber, isDeleted }`; `{ clinicId, nameNormalized, isDeleted }`; `{ clinicId, familyId, isDeleted }`
- visits: `{ clinicId, visitCode }` unique partial; `{ clinicId, visitDate }`; `{ clinicId, patientId, visitDate }`; `{ clinicId, doctorId, visitDate }`
- consultations: unique `visitId`; `{ clinicId, patientId, createdAt }`
- followups: `{ clinicId, followupDate, status, isDeleted }`; `{ clinicId, patientId, followupDate }`
- appointments: `{ clinicId, appointmentDate, status, isDeleted }`; `{ clinicId, doctorId, appointmentDate }`
- payments: `{ clinicId, status, dueDate }`
- auditLogs: `{ createdAt }`, `{ clinicId, createdAt }`

## Validation

Mongoose enums, required refs, `min` on amounts and day counts, trimmed strings, lowercase emails. Domain rules (duplicate mobile owner, clinic access) live in services, not in schema methods.

## Transactions

Phase 1 services write related documents sequentially (visit → consultation → follow-up). Phase 2 APIs that must keep those writes atomic should use MongoDB transactions when a replica set is available.

## Integrity tests

`server/tests/phase1.database.test.ts` covers:

- Clinic / user / assignment creation
- Patient create + repeat mobile lookup
- Family members as distinct patients
- Second visit without mutating the first
- Follow-up date calculation and status classification
- Assignment-based clinic access denial
- Same mobile allowed in another clinic (separate patient)
- Payment history append (no overwrite)
- Password hashes only, never plaintext
