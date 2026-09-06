import { Router } from "express";
import { login, logout, me, refresh } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validateBody } from "../middleware/errorHandler.js";
import { loginSchema } from "../validators/schemas.js";

export const authRouter = Router();
authRouter.post("/login", validateBody(loginSchema), login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", authenticate, me);
