# MASTER_API.md

Last updated: 2026-08-27  
Status: **Implemented** for auth, clinics, users, patients, visits, consultations, follow-ups, appointments, dashboards, payments, subscriptions, audit, and settings.

## Conventions (to implement in Phase 2)

Base path: `/api/v1`

Envelope:

```json
{
  "success": true,
  "message": "Patient retrieved successfully",
  "data": {}
}
```

Errors use the same envelope with `success: false`, a machine `code`, and optional `errors[]` for validation.

Every protected route must enforce: authentication + role + permission + clinic access. Never trust `clinicId` from the client without assignment checks (Super Admin excepted).

Pagination: `page`, `limit` (max 100). List responses include `total`.

## Planned resources

### Auth

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

### Clinics

- `GET /api/v1/clinics`
- `POST /api/v1/clinics`
- `GET /api/v1/clinics/:clinicId`
- `PATCH /api/v1/clinics/:clinicId`
- `POST /api/v1/clinics/:clinicId/activate`
- `POST /api/v1/clinics/:clinicId/deactivate`
- `GET /api/v1/clinics/:clinicId/settings`
- `PATCH /api/v1/clinics/:clinicId/settings`

### Users and assignments

- `GET /api/v1/users`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:userId`
- `POST /api/v1/users/:userId/password-reset`
- `POST /api/v1/clinics/:clinicId/admins`
- `POST /api/v1/clinics/:clinicId/doctors`
- `POST /api/v1/clinics/:clinicId/reception`

### Patients, visits, consultations

- `GET /api/v1/clinics/:clinicId/patients`
- `GET /api/v1/clinics/:clinicId/patients/lookup?mobile=`
- `POST /api/v1/clinics/:clinicId/patients`
- `GET /api/v1/clinics/:clinicId/patients/:patientId`
- `POST /api/v1/clinics/:clinicId/patients/:patientId/visits`
- `POST /api/v1/clinics/:clinicId/visits/:visitId/consultations`

### Follow-ups and appointments

- `GET /api/v1/clinics/:clinicId/followups`
- `POST /api/v1/clinics/:clinicId/followups/:followupId/complete`
- `GET /api/v1/clinics/:clinicId/appointments`
- `POST /api/v1/clinics/:clinicId/appointments`

### Billing (Super Admin)

- `GET /api/v1/subscriptions`
- `GET /api/v1/payments`
- `POST /api/v1/payments` (new history row, never overwrite)

### Audit

- `GET /api/v1/audit-logs` (Super Admin only)

## Phase 1 note

Database services already implement the behaviors these routes will call (`findPatientsByMobile`, `createVisit`, `createConsultationWithFollowup`, `getAssignedClinicIds`). Do not add a parallel API-layer copy of that logic.
