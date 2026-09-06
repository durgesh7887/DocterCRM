import { Router } from "express";
import {
  createPayment,
  getSuperDashboard,
  listAuditLogs,
  listPayments,
  listSettings,
  listSubscriptions,
} from "../controllers/admin.controller.js";
import { createUserHandler, listUsers, resetPassword } from "../controllers/user.controller.js";
import { authenticate, requirePermission, requireRoles } from "../middleware/auth.js";
import { validateBody } from "../middleware/errorHandler.js";
import { passwordResetSchema, paymentCreateSchema, userCreateSchema } from "../validators/schemas.js";

export const adminRouter = Router();
adminRouter.use(authenticate, requireRoles("SUPER_ADMIN"));

adminRouter.get("/dashboard", getSuperDashboard);
adminRouter.get("/users", requirePermission("users.manage"), listUsers);
adminRouter.post("/users", requirePermission("users.manage"), validateBody(userCreateSchema), createUserHandler);
adminRouter.post(
  "/users/:userId/password-reset",
  requirePermission("users.manage"),
  validateBody(passwordResetSchema),
  resetPassword,
);
adminRouter.get("/payments", requirePermission("payments.manage"), listPayments);
adminRouter.post(
  "/payments",
  requirePermission("payments.manage"),
  validateBody(paymentCreateSchema),
  createPayment,
);
adminRouter.get("/subscriptions", requirePermission("payments.manage"), listSubscriptions);
adminRouter.get("/audit-logs", requirePermission("audit.read"), listAuditLogs);
adminRouter.get("/settings", requirePermission("settings.manage"), listSettings);
