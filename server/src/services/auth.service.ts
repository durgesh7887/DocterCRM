import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { ROLE_PERMISSIONS } from "../config/permissions.js";
import { env } from "../config/env.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { User } from "../models/User.js";
import type { AuthUser } from "../types/express.js";
import type { UserRole } from "../types/enums.js";
import { AppError } from "../utils/AppError.js";
import { verifyPassword } from "../utils/password.js";
import { getAccessibleClinicIds } from "./assignment.service.js";

function signAccessToken(userId: string, role: UserRole) {
  return jwt.sign({ sub: userId, role }, env.jwtAccessSecret, {
    expiresIn: env.accessTtl as jwt.SignOptions["expiresIn"],
  });
}

function signRefreshToken(userId: string, tokenId: string) {
  return jwt.sign({ sub: userId, jti: tokenId }, env.jwtRefreshSecret, {
    expiresIn: env.refreshTtl as jwt.SignOptions["expiresIn"],
  });
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function toAuthUser(user: {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: UserRole;
}): Promise<AuthUser> {
  const clinicIds = await getAccessibleClinicIds(user.role, user._id);
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: [...(ROLE_PERMISSIONS[user.role] ?? [])],
    clinicIds: clinicIds.map((id) => id.toString()),
  };
}

export async function loginWithPassword(email: string, password: string, meta: { ip: string; userAgent: string }) {
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    isDeleted: false,
  }).select("+passwordHash");

  if (!user || user.status !== "ACTIVE") {
    throw new AppError("Invalid email or password", 401, "UNAUTHORIZED");
  }

  const matches = await verifyPassword(password, user.passwordHash);
  if (!matches) {
    throw new AppError("Invalid email or password", 401, "UNAUTHORIZED");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokenId = new Types.ObjectId().toString();
  const refreshToken = signRefreshToken(user._id.toString(), tokenId);
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  const authUser = await toAuthUser(user);
  return {
    accessToken: signAccessToken(user._id.toString(), user.role),
    refreshToken,
    user: authUser,
  };
}

export async function rotateRefreshToken(refreshToken: string, meta: { ip: string; userAgent: string }) {
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(refreshToken, env.jwtRefreshSecret) as jwt.JwtPayload;
  } catch {
    throw new AppError("Invalid refresh token", 401, "UNAUTHORIZED");
  }

  const stored = await RefreshToken.findOne({ tokenHash: hashToken(refreshToken), revokedAt: null });
  if (!stored || stored.expiresAt.getTime() < Date.now()) {
    throw new AppError("Invalid refresh token", 401, "UNAUTHORIZED");
  }

  stored.revokedAt = new Date();
  await stored.save();

  const user = await User.findOne({ _id: payload.sub, isDeleted: false, status: "ACTIVE" });
  if (!user) {
    throw new AppError("Invalid refresh token", 401, "UNAUTHORIZED");
  }

  const tokenId = new Types.ObjectId().toString();
  const nextRefresh = signRefreshToken(user._id.toString(), tokenId);
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(nextRefresh),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return {
    accessToken: signAccessToken(user._id.toString(), user.role),
    refreshToken: nextRefresh,
    user: await toAuthUser(user),
  };
}

export async function revokeRefreshToken(refreshToken: string) {
  await RefreshToken.updateOne({ tokenHash: hashToken(refreshToken) }, { $set: { revokedAt: new Date() } });
}

export function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, env.jwtAccessSecret) as jwt.JwtPayload;
  } catch {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
}
