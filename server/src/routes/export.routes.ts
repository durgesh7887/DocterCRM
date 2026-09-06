import { Router } from "express";
import { exportAll, exportClinic } from "../controllers/export.controller.js";
import { authenticate, requireClinicAccess, requireRoles } from "../middleware/auth.js";

export const exportRouter = Router();
exportRouter.use(authenticate);

// Export ALL clinics data — super admin only
exportRouter.get(
  "/export/all",
  requireRoles("SUPER_ADMIN"),
  exportAll,
);

// Export single clinic data — super admin (or admins with clinic access)
exportRouter.get(
  "/export/clinic/:clinicId",
  requireClinicAccess,
  exportClinic,
);
