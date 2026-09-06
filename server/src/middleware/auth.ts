import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { User } from "../models/User.js";
import { toAuthUser, verifyAccessToken } from "../services/auth.service.js";
import { AppError } from "../utils/AppError.js";
import { param } from "../utils/apiResponse.js";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      throw new AppError("Authentication required", 401, "UNAUTHORIZED");
    }

    const payload = verifyAccessToken(token);
    const user = await User.findOne({ _id: payload.sub, isDeleted: false, status: "ACTIVE" });
    if (!user) {
      throw new AppError("Authentication required", 401, "UNAUTHORIZED");
    }

    req.authUser = await toAuthUser(user);
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRoles(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      next(new AppError("You do not have access to this resource", 403, "FORBIDDEN"));
      return;
    }
    next();
  };
}

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.authUser?.permissions.includes(permission)) {
      next(new AppError("You do not have permission for this action", 403, "FORBIDDEN"));
      return;
    }
    next();
  };
}

export function requireClinicAccess(req: Request, _res: Response, next: NextFunction) {
  try {
    const clinicId = param(req, "clinicId");
    if (!clinicId || !Types.ObjectId.isValid(clinicId)) {
      throw new AppError("Invalid clinic", 400, "VALIDATION_ERROR");
    }

    const user = req.authUser;
    if (!user) {
      throw new AppError("Authentication required", 401, "UNAUTHORIZED");
    }

    if (user.role !== "SUPER_ADMIN") {
      const allowed = user.clinicIds.some((id) => id.toString() === clinicId);
      if (!allowed) {
        throw new AppError("Clinic access denied", 403, "FORBIDDEN");
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}
