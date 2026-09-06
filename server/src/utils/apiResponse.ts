import type { Request, Response } from "express";
import { AppError } from "./AppError.js";

export function ok(res: Response, message: string, data: unknown = {}, status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function fail(
  res: Response,
  message: string,
  status = 400,
  code = "BAD_REQUEST",
  errors?: Array<{ field: string; message: string }>,
) {
  return res.status(status).json({ success: false, message, code, errors, data: null });
}

export function parsePagination(query: Record<string, unknown>) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export function param(req: Request, name: string): string {
  const value = req.params[name];
  const id = Array.isArray(value) ? value[0] : value;
  if (!id) {
    throw new AppError(`Missing ${name}`, 400, "VALIDATION_ERROR");
  }
  return id;
}
