# MASTER_UI_GUIDELINES.md

Last updated: 2026-08-27  
Status: Implemented in `web/` (CRM) and `doctor-pwa/` (Doctor).

## Product surfaces

- Web CRM: Super Admin, Admin, Reception — desktop-first, responsive.
- Doctor PWA: mobile-first, installable, API-driven. Do not cache clinical records in insecure storage.

## Visual principles

- Clean, professional, low clutter. Clinic staff are non-technical.
- Fast navigation: search and primary actions visible without hunting.
- Loading, empty, success, and error states on every data view.
- Do not hide unauthorized clinics in the UI as the only control. The API must reject them.

## Information architecture (planned)

### Super Admin

Dashboard, Clinics, Users, Payments, Subscriptions, Audit Logs, Settings.

### Admin

Dashboard, assigned Clinics, Clinic Settings, and clinic workspace modules they are permitted to operate (including receptionless clinics).

### Reception

Dashboard, Consultation (mobile lookup → patient → visit), Patients, Follow-ups, Appointments, Reports.

### Doctor PWA

Login → My Clinics → Clinic Dashboard → Patients / Consultations / Follow-ups / Appointments / Reports / Profile.

## Clinic workspace (when a clinic is opened)

Overview, Patients, Consultation, Follow-ups, Appointments, Doctors, Reception, Reports, Settings.

Honour `clinicSettings` flags for module visibility. Flags do not grant extra access.

## Forms

- Patient mobile lookup is the start of consultation intake.
- If matches exist, user selects a patient; never silently create a duplicate.
- Confirm before deactivate clinic, cancel appointment, or complete follow-up.

## Technical UI stack (when Phase 2 UI starts)

React, TypeScript, React Router, Tailwind CSS, TanStack Query for server state, Context or Zustand only for auth/session. Keep business rules in API services, not in components.
