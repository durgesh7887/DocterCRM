import type { CookieOptions, Request, Response } from "express";
import { env } from "../config/env.js";
import { loginWithPassword, revokeRefreshToken, rotateRefreshToken } from "../services/auth.service.js";
import { writeAuditLog } from "../services/audit.service.js";
import { ok } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { Types } from "mongoose";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: env.nodeEnv === "production" ? "none" : "lax",
  secure: env.nodeEnv === "production",
  path: "/api/v1/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginWithPassword(req.body.email, req.body.password, {
    ip: req.ip ?? "",
    userAgent: req.get("user-agent") ?? "",
  });

  await writeAuditLog({
    actorUserId: new Types.ObjectId(result.user.id),
    action: "Login",
    module: "AUTH",
    recordType: "User",
    recordId: new Types.ObjectId(result.user.id),
    ipAddress: req.ip ?? "",
  });

  res.cookie(env.cookieName, result.refreshToken, cookieOptions);
  return ok(res, "Logged in successfully", {
    accessToken: result.accessToken,
    user: result.user,
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[env.cookieName] as string | undefined;
  if (!token) {
    throw new AppError("Refresh token missing", 401, "UNAUTHORIZED");
  }
  const result = await rotateRefreshToken(token, {
    ip: req.ip ?? "",
    userAgent: req.get("user-agent") ?? "",
  });
  res.cookie(env.cookieName, result.refreshToken, cookieOptions);
  return ok(res, "Session refreshed", { accessToken: result.accessToken, user: result.user });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[env.cookieName] as string | undefined;
  if (token) {
    await revokeRefreshToken(token);
  }
  res.clearCookie(env.cookieName, {
    path: "/api/v1/auth",
    sameSite: env.nodeEnv === "production" ? "none" : "lax",
    secure: env.nodeEnv === "production",
  });
  return ok(res, "Logged out successfully");
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, "Session loaded", { user: req.authUser });
});
