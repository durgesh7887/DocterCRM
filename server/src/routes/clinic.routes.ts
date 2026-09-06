import { Router } from "express";
import {
  clinicStaff,
  createClinicHandler,
  getClinic,
  getSettings,
  listClinics,
  setClinicStatus,
  updateClinic,
  updateSettings,
} from "../controllers/clinic.controller.js";
import {
  completeFollowup,
  createAppointmentHandler,
  createConsultationHandler,
  createFollowupHandler,
  createPatientHandler,
  createVisitHandler,
  clinicReports,
  getPatient,
  listAppointments,
  listClinicDoctors,
  listFollowups,
  listPatients,
  lookupPatients,
} from "../controllers/clinicOps.controller.js";
import { getClinicDashboard } from "../controllers/admin.controller.js";
import { assignStaff } from "../controllers/user.controller.js";
import { authenticate, requireClinicAccess, requirePermission, requireRoles } from "../middleware/auth.js";
import { validateBody } from "../middleware/errorHandler.js";
import {
  appointmentCreateSchema,
  clinicCreateSchema,
  clinicUpdateSchema,
  consultationCreateSchema,
  followupCreateSchema,
  patientCreateSchema,
  settingsUpdateSchema,
  visitCreateSchema,
} from "../validators/schemas.js";

export const clinicRouter = Router();
clinicRouter.use(authenticate);

clinicRouter.get("/", listClinics);
clinicRouter.post(
  "/",
  requireRoles("SUPER_ADMIN"),
  requirePermission("clinics.create"),
  validateBody(clinicCreateSchema),
  createClinicHandler,
);

clinicRouter.get("/:clinicId", requireClinicAccess, requirePermission("clinics.read"), getClinic);
clinicRouter.patch(
  "/:clinicId",
  requireRoles("SUPER_ADMIN"),
  requirePermission("clinics.update"),
  validateBody(clinicUpdateSchema),
  updateClinic,
);
clinicRouter.post(
  "/:clinicId/activate",
  requireRoles("SUPER_ADMIN"),
  requirePermission("clinics.activate"),
  setClinicStatus,
);
clinicRouter.post(
  "/:clinicId/deactivate",
  requireRoles("SUPER_ADMIN"),
  requirePermission("clinics.activate"),
  setClinicStatus,
);
clinicRouter.get("/:clinicId/settings", requireClinicAccess, getSettings);
clinicRouter.patch(
  "/:clinicId/settings",
  requireClinicAccess,
  requirePermission("settings.manage"),
  validateBody(settingsUpdateSchema),
  updateSettings,
);
clinicRouter.get("/:clinicId/dashboard", requireClinicAccess, getClinicDashboard);
clinicRouter.get("/:clinicId/staff", requireClinicAccess, clinicStaff);
clinicRouter.get("/:clinicId/doctors", requireClinicAccess, listClinicDoctors);
clinicRouter.get("/:clinicId/reports", requireClinicAccess, requirePermission("reports.read"), clinicReports);

clinicRouter.post(
  "/:clinicId/admins",
  requireRoles("SUPER_ADMIN"),
  requirePermission("admins.manage"),
  assignStaff,
);
clinicRouter.post(
  "/:clinicId/doctors",
  requireRoles("SUPER_ADMIN", "ADMIN"),
  requirePermission("doctors.manage"),
  assignStaff,
);
clinicRouter.post(
  "/:clinicId/reception",
  requireRoles("SUPER_ADMIN", "ADMIN"),
  requirePermission("reception.manage"),
  assignStaff,
);

clinicRouter.get("/:clinicId/patients/lookup", requireClinicAccess, requirePermission("patients.read"), lookupPatients);
clinicRouter.get("/:clinicId/patients", requireClinicAccess, requirePermission("patients.read"), listPatients);
clinicRouter.post(
  "/:clinicId/patients",
  requireClinicAccess,
  requirePermission("patients.write"),
  validateBody(patientCreateSchema),
  createPatientHandler,
);
clinicRouter.get("/:clinicId/patients/:patientId", requireClinicAccess, requirePermission("patients.read"), getPatient);
clinicRouter.post(
  "/:clinicId/patients/:patientId/visits",
  requireClinicAccess,
  requirePermission("visits.write"),
  validateBody(visitCreateSchema),
  createVisitHandler,
);
clinicRouter.post(
  "/:clinicId/visits/:visitId/consultations",
  requireClinicAccess,
  requirePermission("visits.write"),
  validateBody(consultationCreateSchema),
  createConsultationHandler,
);

clinicRouter.get("/:clinicId/followups", requireClinicAccess, requirePermission("followups.write"), listFollowups);
clinicRouter.post(
  "/:clinicId/followups",
  requireClinicAccess,
  requirePermission("followups.write"),
  validateBody(followupCreateSchema),
  createFollowupHandler,
);
clinicRouter.post(
  "/:clinicId/followups/:followupId/complete",
  requireClinicAccess,
  requirePermission("followups.write"),
  completeFollowup,
);
clinicRouter.get("/:clinicId/appointments", requireClinicAccess, requirePermission("appointments.write"), listAppointments);
clinicRouter.post(
  "/:clinicId/appointments",
  requireClinicAccess,
  requirePermission("appointments.write"),
  validateBody(appointmentCreateSchema),
  createAppointmentHandler,
);
