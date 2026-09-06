import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/AppError.js";
import { fail } from "../utils/apiResponse.js";

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(
        new AppError(
          "Validation failed",
          422,
          "VALIDATION_ERROR",
          parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        ),
      );
      return;
    }
    req.body = parsed.data;
    next();
  };
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return fail(res, err.message, err.statusCode, err.code, err.errors);
  }

  const mongo = err as { code?: number; name?: string; message?: string };
  if (mongo?.code === 11000) {
    return fail(res, "A record with those unique values already exists", 409, "CONFLICT");
  }

  console.error(err);
  return fail(res, mongo?.message || "Internal server error", 500, "INTERNAL");
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
